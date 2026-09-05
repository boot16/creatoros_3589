'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const weeklyData = [
  { week: 'Jul 12', youtube: 2, instagram: 3, total: 5 },
  { week: 'Jul 19', youtube: 3, instagram: 2, total: 5 },
  { week: 'Jul 26', youtube: 1, instagram: 4, total: 5 },
  { week: 'Aug 2',  youtube: 4, instagram: 1, total: 5 },
  { week: 'Aug 9',  youtube: 2, instagram: 3, total: 5 },
  { week: 'Aug 16', youtube: 1, instagram: 1, total: 2 },
  { week: 'Aug 23', youtube: 3, instagram: 4, total: 7 },
  { week: 'Aug 30', youtube: 2, instagram: 2, total: 4 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: '160px' }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={`tip-${p.dataKey}`} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--muted-foreground)' }}>{p.name}</span>
          </div>
          <span className="font-semibold metric-value" style={{ color: 'var(--foreground)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function PipelineChartInner() {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Posts Published</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Last 8 weeks · by platform</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--muted)' }}>
          {(['area', 'bar'] as const).map((t) => (
            <button
              key={`chart-type-${t}`}
              onClick={() => setChartType(t)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: chartType === t ? 'var(--card)' : 'transparent',
                color: chartType === t ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: chartType === t ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {t === 'area' ? 'Area' : 'Bar'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {chartType === 'area' ? (
          <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ytGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(val) => <span style={{ color: 'var(--muted-foreground)' }}>{val}</span>}
            />
            <Area type="monotone" dataKey="youtube" name="YouTube" stroke="var(--primary)" strokeWidth={2} fill="url(#ytGrad)" />
            <Area type="monotone" dataKey="instagram" name="Instagram" stroke="var(--accent)" strokeWidth={2} fill="url(#igGrad)" />
          </AreaChart>
        ) : (
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(val) => <span style={{ color: 'var(--muted-foreground)' }}>{val}</span>}
            />
            <Bar dataKey="youtube" name="YouTube" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="instagram" name="Instagram" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}