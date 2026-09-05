-- CreatorOS MVP Schema
-- Tables: user_profiles, ideas, drafts, calendar_entries

-- 1. Types
DROP TYPE IF EXISTS public.content_status CASCADE;
CREATE TYPE public.content_status AS ENUM ('idea', 'draft', 'review', 'scheduled', 'published');

DROP TYPE IF EXISTS public.content_platform CASCADE;
CREATE TYPE public.content_platform AS ENUM ('youtube', 'instagram', 'both');

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    youtube_channel TEXT DEFAULT '',
    instagram_handle TEXT DEFAULT '',
    plan TEXT DEFAULT 'free',
    ai_credits_used INTEGER DEFAULT 0,
    ai_credits_limit INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    platform public.content_platform DEFAULT 'youtube',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    score INTEGER DEFAULT 0,
    is_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    hook TEXT DEFAULT '',
    platform public.content_platform DEFAULT 'youtube',
    status public.content_status DEFAULT 'draft',
    idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
    word_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.calendar_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES public.drafts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    platform public.content_platform DEFAULT 'youtube',
    status public.content_status DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id ON public.calendar_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_scheduled_at ON public.calendar_entries(scheduled_at);

-- 4. Functions (BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_ideas" ON public.ideas;
CREATE POLICY "users_manage_own_ideas"
ON public.ideas
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_drafts" ON public.drafts;
CREATE POLICY "users_manage_own_drafts"
ON public.drafts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_calendar_entries" ON public.calendar_entries;
CREATE POLICY "users_manage_own_calendar_entries"
ON public.calendar_entries
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_ideas_updated_at ON public.ideas;
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_drafts_updated_at ON public.drafts;
CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON public.drafts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_calendar_entries_updated_at ON public.calendar_entries;
CREATE TRIGGER update_calendar_entries_updated_at
    BEFORE UPDATE ON public.calendar_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Demo user mock data
DO $$
DECLARE
    demo_uuid UUID := gen_random_uuid();
    idea1_uuid UUID := gen_random_uuid();
    idea2_uuid UUID := gen_random_uuid();
    idea3_uuid UUID := gen_random_uuid();
    draft1_uuid UUID := gen_random_uuid();
    draft2_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        demo_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'demo@creatoros.app', crypt('demo1234', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('full_name', 'Demo Creator', 'avatar_url', ''),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;

    -- Ideas (trigger creates user_profiles automatically)
    INSERT INTO public.ideas (id, user_id, title, description, platform, score, is_saved)
    VALUES
        (idea1_uuid, demo_uuid, '10 AI Tools Every Creator Needs in 2026', 'Deep dive into the best AI tools for content creation, editing, and distribution', 'youtube', 92, true),
        (idea2_uuid, demo_uuid, 'Behind the Scenes: My Content Creation Setup', 'Show my full workspace, tools, and daily workflow as a solo creator', 'instagram', 78, false),
        (idea3_uuid, demo_uuid, 'How I Grew to 100K Without Paid Ads', 'Organic growth strategy breakdown with real data and lessons learned', 'youtube', 88, true)
    ON CONFLICT (id) DO NOTHING;

    -- Drafts
    INSERT INTO public.drafts (id, user_id, title, content, hook, platform, status, idea_id, word_count)
    VALUES
        (draft1_uuid, demo_uuid, '10 AI Tools Every Creator Needs in 2026',
         'In this video, I am going to walk you through the 10 AI tools that have completely transformed my content creation workflow...',
         'What if you could create a week of content in just one afternoon?',
         'youtube', 'draft', idea1_uuid, 450),
        (draft2_uuid, demo_uuid, 'How I Grew to 100K Without Paid Ads',
         'Growing a YouTube channel organically in 2026 is harder than ever, but it is absolutely possible...',
         'I hit 100K subscribers without spending a single dollar on ads. Here is exactly how.',
         'youtube', 'review', idea3_uuid, 820)
    ON CONFLICT (id) DO NOTHING;

    -- Calendar entries
    INSERT INTO public.calendar_entries (user_id, draft_id, title, platform, status, scheduled_at)
    VALUES
        (demo_uuid, draft1_uuid, '10 AI Tools Every Creator Needs in 2026', 'youtube', 'scheduled', now() + interval '3 days'),
        (demo_uuid, draft2_uuid, 'How I Grew to 100K Without Paid Ads', 'youtube', 'scheduled', now() + interval '10 days'),
        (demo_uuid, null, 'Weekly Instagram Reel: Studio Tour', 'instagram', 'scheduled', now() + interval '5 days')
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
