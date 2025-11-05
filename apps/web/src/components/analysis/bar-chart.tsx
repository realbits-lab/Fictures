'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils/cn';

interface BarChartProps {
  data: any[];
  xKey: string;
  bars: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
  className?: string;
}

export function BarChart({ data, xKey, bars, height = 300, className }: BarChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey={xKey}
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--color-popover))',
              border: '1px solid hsl(var(--color-border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--color-popover-foreground))' }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
