import React from 'react';
import AppLayout from '@/components/AppLayout';
import CalendarShell from './components/CalendarShell';

export default function ContentCalendarPage() {
  return (
    <AppLayout
      pageTitle="Content Calendar"
      pageSubtitle="Plan and schedule your content pipeline"
    >
      <CalendarShell />
    </AppLayout>
  );
}