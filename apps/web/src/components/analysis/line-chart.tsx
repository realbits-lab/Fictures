'use client';

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils/cn';

interface LineChartProps {
  data: any[];
  xKey: string;
  lines: {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }[];
  height?: number;
  className?: string;
}

export function LineChart({ data, xKey, lines, height = 300, className }: LineChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
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
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
