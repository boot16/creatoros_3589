'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const PipelineChartInner = dynamic(() => import('./PipelineChartInner'), { ssr: false });

export default function PipelineChart() {
  return <PipelineChartInner />;
}