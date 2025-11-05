"use client";

import { Card, CardContent } from "@/components/ui";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useState } from "react";

export interface MetricCardProps {
  value: string | number;
  label: string;
  color: string;
  summary: string;
  details?: string[];
}

export function MetricCard({ value, label, color, summary, details }: MetricCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="text-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <PopoverTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="w-full text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
          >
            <CardContent className="py-4">
              <div className={`text-2xl font-bold ${color}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span>{label}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </CardContent>
          </PopoverTrigger>
          {isOpen && (
            <PopoverContent align="start" side="bottom">
              <div className="space-y-3 text-left">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 text-left">
                  {label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-left">
                  {summary}
                </p>
                {details && details.length > 0 && (
                  <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1.5 pl-4 text-left">
                    {details.map((detail, index) => (
                      <li key={index} className="leading-relaxed list-disc ml-1">{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </PopoverContent>
          )}
        </div>
      </Popover>
    </Card>
  );
}
