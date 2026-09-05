import React from 'react';
import AppLayout from '@/components/AppLayout';
import ContentEditorShell from './components/ContentEditorShell';

export default function ContentEditorPage() {
  return (
    <AppLayout
      pageTitle="Content Editor"
      pageSubtitle="Write scripts, captions & hooks with AI assistance"
    >
      <ContentEditorShell />
    </AppLayout>
  );
}