-- CreatorOS Full Schema — PRD-aligned
-- Adds: projects, opportunities, trends, script_drafts, studio_sessions, shortlist, collab_profiles

-- ============================================================
-- 1. New ENUMs
-- ============================================================
DROP TYPE IF EXISTS public.project_status CASCADE;
CREATE TYPE public.project_status AS ENUM ('active', 'paused', 'completed', 'discarded');

DROP TYPE IF EXISTS public.project_content_type CASCADE;
CREATE TYPE public.project_content_type AS ENUM ('youtube_video', 'instagram_reel', 'instagram_post', 'instagram_carousel', 'short_form', 'podcast');

DROP TYPE IF EXISTS public.opportunity_category CASCADE;
CREATE TYPE public.opportunity_category AS ENUM ('trending', 'evergreen', 'collab', 'seasonal', 'niche');

DROP TYPE IF EXISTS public.trend_category CASCADE;
CREATE TYPE public.trend_category AS ENUM ('tech', 'lifestyle', 'education', 'entertainment', 'business', 'health', 'gaming', 'other');

-- ============================================================
-- 2. New Tables
-- ============================================================

-- Projects (M2 workspace)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    objective TEXT DEFAULT '',
    content_type public.project_content_type DEFAULT 'youtube_video',
    platform public.content_platform DEFAULT 'youtube',
    status public.project_status DEFAULT 'active',
    brief_markdown TEXT DEFAULT '',
    brief_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Creative objects (content items within a project)
CREATE TABLE IF NOT EXISTS public.creative_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    object_type TEXT NOT NULL DEFAULT 'note',
    title TEXT NOT NULL DEFAULT '',
    body TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities (scored content opportunities)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category public.opportunity_category DEFAULT 'trending',
    platform public.content_platform DEFAULT 'youtube',
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    trend_score INTEGER DEFAULT 0,
    audience_fit INTEGER DEFAULT 0,
    competition_gap INTEGER DEFAULT 0,
    monetization_potential INTEGER DEFAULT 0,
    timing_score INTEGER DEFAULT 0,
    collab_potential INTEGER DEFAULT 0,
    why_bullets JSONB DEFAULT '[]',
    formula_breakdown JSONB DEFAULT '{}',
    is_saved BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trends (Trend Radar data)
CREATE TABLE IF NOT EXISTS public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category public.trend_category DEFAULT 'other',
    platform public.content_platform DEFAULT 'youtube',
    momentum INTEGER DEFAULT 0 CHECK (momentum >= 0 AND momentum <= 100),
    volume INTEGER DEFAULT 0 CHECK (volume >= 0 AND volume <= 100),
    growth_rate DECIMAL(5,2) DEFAULT 0,
    why_relevant TEXT DEFAULT '',
    related_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    audience_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Script drafts (full script editor)
CREATE TABLE IF NOT EXISTS public.script_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    hook TEXT DEFAULT '',
    body TEXT DEFAULT '',
    structure JSONB DEFAULT '[]',
    word_count INTEGER DEFAULT 0,
    status public.content_status DEFAULT 'draft',
    platform public.content_platform DEFAULT 'youtube',
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Studio sessions (AI assistant chat)
CREATE TABLE IF NOT EXISTS public.studio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Session',
    messages JSONB DEFAULT '[]',
    context_type TEXT DEFAULT 'general',
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Shortlist (saved opportunities)
CREATE TABLE IF NOT EXISTS public.shortlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, opportunity_id)
);

-- Collab profiles (creator matching)
CREATE TABLE IF NOT EXISTS public.collab_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    channel_handle TEXT DEFAULT '',
    platform public.content_platform DEFAULT 'youtube',
    subscriber_count INTEGER DEFAULT 0,
    niche TEXT DEFAULT '',
    content_style TEXT DEFAULT '',
    compatibility_score INTEGER DEFAULT 0 CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    audience_overlap INTEGER DEFAULT 0,
    style_match INTEGER DEFAULT 0,
    topic_alignment INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    collab_history INTEGER DEFAULT 0,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_proposed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity events (project activity log)
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_objects_project_id ON public.creative_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON public.opportunities(score DESC);
CREATE INDEX IF NOT EXISTS idx_trends_user_id ON public.trends(user_id);
CREATE INDEX IF NOT EXISTS idx_trends_momentum ON public.trends(momentum DESC);
CREATE INDEX IF NOT EXISTS idx_script_drafts_user_id ON public.script_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_user_id ON public.studio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_user_id ON public.shortlist(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_profiles_user_id ON public.collab_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_profiles_score ON public.collab_profiles(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_project_id ON public.activity_events(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);

-- ============================================================
-- 4. Updated_at trigger function (already exists, reuse)
-- ============================================================

-- ============================================================
-- 5. Enable RLS
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS Policies
-- ============================================================
DROP POLICY IF EXISTS "users_manage_own_projects" ON public.projects;
CREATE POLICY "users_manage_own_projects" ON public.projects
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_creative_objects" ON public.creative_objects;
CREATE POLICY "users_manage_own_creative_objects" ON public.creative_objects
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_opportunities" ON public.opportunities;
CREATE POLICY "users_manage_own_opportunities" ON public.opportunities
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_trends" ON public.trends;
CREATE POLICY "users_manage_own_trends" ON public.trends
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_script_drafts" ON public.script_drafts;
CREATE POLICY "users_manage_own_script_drafts" ON public.script_drafts
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_studio_sessions" ON public.studio_sessions;
CREATE POLICY "users_manage_own_studio_sessions" ON public.studio_sessions
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_shortlist" ON public.shortlist;
CREATE POLICY "users_manage_own_shortlist" ON public.shortlist
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_collab_profiles" ON public.collab_profiles;
CREATE POLICY "users_manage_own_collab_profiles" ON public.collab_profiles
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_activity_events" ON public.activity_events;
CREATE POLICY "users_manage_own_activity_events" ON public.activity_events
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. Triggers for updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_creative_objects_updated_at ON public.creative_objects;
CREATE TRIGGER update_creative_objects_updated_at
    BEFORE UPDATE ON public.creative_objects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_trends_updated_at ON public.trends;
CREATE TRIGGER update_trends_updated_at
    BEFORE UPDATE ON public.trends
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_script_drafts_updated_at ON public.script_drafts;
CREATE TRIGGER update_script_drafts_updated_at
    BEFORE UPDATE ON public.script_drafts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_studio_sessions_updated_at ON public.studio_sessions;
CREATE TRIGGER update_studio_sessions_updated_at
    BEFORE UPDATE ON public.studio_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_collab_profiles_updated_at ON public.collab_profiles;
CREATE TRIGGER update_collab_profiles_updated_at
    BEFORE UPDATE ON public.collab_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. Seed demo data for existing demo user
-- ============================================================
DO $$
DECLARE
    demo_user_id UUID;
    proj1_id UUID := gen_random_uuid();
    proj2_id UUID := gen_random_uuid();
    opp1_id UUID := gen_random_uuid();
    opp2_id UUID := gen_random_uuid();
    opp3_id UUID := gen_random_uuid();
    opp4_id UUID := gen_random_uuid();
    opp5_id UUID := gen_random_uuid();
    trend1_id UUID := gen_random_uuid();
    trend2_id UUID := gen_random_uuid();
    trend3_id UUID := gen_random_uuid();
    trend4_id UUID := gen_random_uuid();
    trend5_id UUID := gen_random_uuid();
    script1_id UUID := gen_random_uuid();
    collab1_id UUID := gen_random_uuid();
    collab2_id UUID := gen_random_uuid();
    collab3_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO demo_user_id FROM public.user_profiles LIMIT 1;

    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'No user found, skipping seed data';
        RETURN;
    END IF;

    -- Projects
    INSERT INTO public.projects (id, user_id, title, objective, content_type, platform, status, brief_markdown)
    VALUES
        (proj1_id, demo_user_id, 'AI Tools Deep Dive Series', 'Build authority in AI creator tools niche with a 3-part series targeting 50K+ views each', 'youtube_video', 'youtube', 'active',
         E'## Brief\n\n### Goal\nCreate a definitive guide to AI tools for creators in 2026.\n\n### Target Audience\nYouTube creators with 10K–500K subscribers looking to scale production.\n\n### Key Angles\n- Practical demos, not theory\n- Cost breakdown per tool\n- Real workflow integration\n\n### Format\n3-part series: Research → Create → Distribute'),
        (proj2_id, demo_user_id, 'Creator Collab: Tech Niche Crossover', 'Partner with a tech creator for a crossover video targeting both audiences', 'youtube_video', 'youtube', 'active', E'## Brief\n\n### Goal\nCollab video with a complementary tech creator.\n\n### Format\nSplit-screen challenge or joint tutorial.')
    ON CONFLICT (id) DO NOTHING;

    -- Opportunities
    INSERT INTO public.opportunities (id, user_id, title, description, category, platform, score, trend_score, audience_fit, competition_gap, monetization_potential, timing_score, collab_potential, why_bullets, formula_breakdown, tags)
    VALUES
        (opp1_id, demo_user_id, 'AI Video Editing Tools Comparison 2026', 'Creators are actively searching for comparisons of the latest AI editing tools. Your tech-forward audience is primed for this.', 'trending', 'youtube', 92,
         96, 94, 92, 88, 90, 82,
         '["Your audience over-indexes on AI tool content (+34% CTR vs avg)", "Search volume up 280% in 30 days with only 12 competing videos", "3 major tools launched in the last 60 days — perfect timing window", "Monetization: affiliate + sponsorship dual-stack potential"]'::jsonb,
         '{"formula": "0.25×trend + 0.25×audience + 0.20×gap + 0.10×monetization + 0.10×timing + 0.10×collab", "calculated": 91.9}'::jsonb,
         ARRAY['ai', 'tools', 'editing', 'trending']),
        (opp2_id, demo_user_id, 'How I Built a 6-Figure Creator Business', 'Monetization transparency content is surging. Your audience trusts your voice on business topics.', 'evergreen', 'youtube', 87,
         78, 92, 85, 95, 80, 70,
         '["Monetization transparency is the #1 requested topic from your audience", "Evergreen search term with 45K monthly searches", "High CPM category — business/finance ads pay 3–5x average"]'::jsonb,
         '{"formula": "0.25×trend + 0.25×audience + 0.20×gap + 0.10×monetization + 0.10×timing + 0.10×collab", "calculated": 86.8}'::jsonb,
         ARRAY['business', 'monetization', 'evergreen']),
        (opp3_id, demo_user_id, 'Collab: Creator Productivity Stack with @TechWithSarah', 'Sarah Chen (892K subs, 92% compatibility) covers complementary tools. Joint video would cross-pollinate both audiences.', 'collab', 'youtube', 84,
         82, 88, 76, 84, 88, 98,
         '["92% compatibility score with Sarah Chen — highest match in your niche", "Her audience has 67% overlap with your ideal viewer profile", "Collab videos average 2.4x normal view count for both creators"]'::jsonb,
         '{"formula": "0.25×trend + 0.25×audience + 0.20×gap + 0.10×monetization + 0.10×timing + 0.10×collab", "calculated": 84.2}'::jsonb,
         ARRAY['collab', 'productivity', 'tools']),
        (opp4_id, demo_user_id, 'YouTube Algorithm Changes 2026 — What Creators Need to Know', 'Algorithm update content spikes every time YouTube makes changes. Three major updates dropped this quarter.', 'seasonal', 'youtube', 79,
         88, 82, 72, 74, 92, 65,
         '["YouTube made 3 algorithm changes in Q3 2026 — search demand is peaking now", "Time-sensitive: optimal publish window is next 2 weeks", "High share rate — creators bookmark and share algorithm content"]'::jsonb,
         '{"formula": "0.25×trend + 0.25×audience + 0.20×gap + 0.10×monetization + 0.10×timing + 0.10×collab", "calculated": 79.1}'::jsonb,
         ARRAY['youtube', 'algorithm', 'seasonal']),
        (opp5_id, demo_user_id, 'Behind the Scenes: My $0 to $10K/Month Creator Journey', 'Authentic journey content builds deep audience loyalty. Your story is unique and undocumented.', 'niche', 'youtube', 74,
         65, 90, 80, 78, 68, 60,
         '["Authenticity content drives 3x comment rate vs tutorial content", "Your specific journey (bootstrapped, no team) is underrepresented", "Strong series potential — could be 6–12 episodes"]'::jsonb,
         '{"formula": "0.25×trend + 0.25×audience + 0.20×gap + 0.10×monetization + 0.10×timing + 0.10×collab", "calculated": 74.3}'::jsonb,
         ARRAY['journey', 'authentic', 'series'])
    ON CONFLICT (id) DO NOTHING;

    -- Shortlist opp1
    INSERT INTO public.shortlist (user_id, opportunity_id)
    VALUES (demo_user_id, opp1_id), (demo_user_id, opp3_id)
    ON CONFLICT (user_id, opportunity_id) DO NOTHING;

    -- Trends
    INSERT INTO public.trends (id, user_id, title, description, category, platform, momentum, volume, growth_rate, why_relevant, related_topics, audience_tags, opportunity_id)
    VALUES
        (trend1_id, demo_user_id, 'AI Video Generation Tools', 'Sora, Runway, Kling and new entrants are reshaping video production. Creator adoption is accelerating fast.', 'tech', 'youtube', 94, 88, 280.0, 'Your audience is early adopters of AI tools — this is directly in your wheelhouse.', ARRAY['sora', 'runway ml', 'ai editing', 'video generation'], ARRAY['tech creators', 'early adopters', 'filmmakers'], opp1_id),
        (trend2_id, demo_user_id, 'Creator Economy Transparency', 'Creators sharing real revenue numbers, brand deal rates, and business breakdowns are getting massive engagement.', 'business', 'youtube', 82, 76, 145.0, 'Transparency content builds trust and drives subscriptions — aligns with your authentic brand.', ARRAY['revenue reveal', 'brand deals', 'creator income', 'monetization'], ARRAY['aspiring creators', 'business minded', 'entrepreneurs'], opp2_id),
        (trend3_id, demo_user_id, 'Short-Form to Long-Form Funnels', 'Creators using Shorts/Reels as top-of-funnel for long-form content are seeing 40% subscriber conversion lifts.', 'education', 'both', 78, 65, 92.0, 'Cross-platform strategy content is highly shareable in creator communities.', ARRAY['youtube shorts', 'reels strategy', 'funnel', 'cross-platform'], ARRAY['growth hackers', 'multi-platform creators'], NULL),
        (trend4_id, demo_user_id, 'AI-Assisted Script Writing', 'Creators using AI for scripting are publishing 3x more content. Workflow transparency videos are trending.', 'tech', 'youtube', 88, 72, 210.0, 'You can demonstrate your own AI workflow — authentic and educational.', ARRAY['chatgpt scripts', 'ai workflow', 'content creation', 'productivity'], ARRAY['solo creators', 'productivity focused', 'tech savvy'], NULL),
        (trend5_id, demo_user_id, 'Niche Community Building', 'Creators building tight-knit communities around specific niches are outperforming broad-appeal channels on engagement.', 'lifestyle', 'youtube', 71, 58, 67.0, 'Community-first strategy aligns with long-term creator sustainability.', ARRAY['discord', 'community', 'niche content', 'membership'], ARRAY['engaged viewers', 'community builders'], NULL)
    ON CONFLICT (id) DO NOTHING;

    -- Script draft
    INSERT INTO public.script_drafts (id, user_id, project_id, title, hook, body, word_count, status, platform, ai_generated)
    VALUES
        (script1_id, demo_user_id, proj1_id, 'AI Video Editing Tools Comparison 2026',
         'What if you could cut your editing time in half — without sacrificing quality? I tested 7 AI editing tools so you do not have to.',
         E'## HOOK\nWhat if you could cut your editing time in half — without sacrificing quality? I tested 7 AI editing tools so you do not have to.\n\n## BEAT 1: The Problem\nMost creators spend 60% of their production time in post. That is backwards. Your ideas deserve more time than your timeline.\n\n## BEAT 2: The Tools\nHere are the 7 tools I tested over 30 days:\n1. **Descript** — AI transcription + word-based editing\n2. **Runway ML** — AI B-roll generation\n3. **OpusClip** — Auto-clip extraction\n4. **Captions.ai** — Auto-captions with style\n5. **Wondershare Filmora AI** — All-in-one with AI features\n6. **Adobe Premiere AI** — Professional-grade AI assist\n7. **CapCut AI** — Mobile-first AI editing\n\n## BEAT 3: The Results\nAfter 30 days, my editing time dropped from 8 hours per video to 3.5 hours. Here is what actually moved the needle.\n\n## BEAT 4: The Verdict\nThe best stack for solo creators in 2026 is not one tool — it is a workflow. I will show you mine.\n\n## CTA\nIf this saved you time, subscribe — I drop creator workflow content every week.',
         420, 'draft', 'youtube', false)
    ON CONFLICT (id) DO NOTHING;

    -- Collab profiles
    INSERT INTO public.collab_profiles (id, user_id, creator_name, channel_handle, platform, subscriber_count, niche, content_style, compatibility_score, audience_overlap, style_match, topic_alignment, engagement_rate, bio, tags)
    VALUES
        (collab1_id, demo_user_id, 'Sarah Chen', '@TechWithSarah', 'youtube', 892000, 'Tech & Productivity', 'Tutorial-first, high production value, data-driven', 92, 88, 90, 95, 4.8, 'Tech creator focused on productivity tools and workflows. Known for in-depth reviews and honest takes.', ARRAY['tech', 'productivity', 'tools', 'tutorials']),
        (collab2_id, demo_user_id, 'Marcus Rivera', '@CreatorMarcus', 'youtube', 245000, 'Creator Business', 'Storytelling, behind-the-scenes, business transparency', 78, 72, 82, 76, 6.2, 'Creator business educator sharing real revenue numbers and growth strategies.', ARRAY['business', 'monetization', 'growth', 'creator economy']),
        (collab3_id, demo_user_id, 'Priya Nair', '@PriyaCreates', 'both', 380000, 'AI & Future of Work', 'Educational, trend-forward, community-focused', 85, 80, 88, 84, 5.1, 'AI and future-of-work creator bridging tech and human creativity.', ARRAY['ai', 'future of work', 'education', 'trends'])
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data failed: %', SQLERRM;
END $$;
