"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface Schedule {
	id: string;
	name: string;
	scheduleType: string;
	nextPublishAt: Date | null;
	totalPublished: number;
	isActive: boolean;
}

interface MobileScheduleListProps {
	schedules: Schedule[];
	onScheduleClick?: (schedule: Schedule) => void;
}

export function MobileScheduleList({
	schedules,
	onScheduleClick,
}: MobileScheduleListProps) {
	return (
		<div className="space-y-3">
			{schedules.map((schedule) => (
				<button
					key={schedule.id}
					onClick={() => onScheduleClick?.(schedule)}
					className="w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg active:scale-98 transition-transform"
				>
					<div className="flex items-start justify-between mb-2">
						<div>
							<h3 className="font-semibold text-gray-900 dark:text-gray-100">
								{schedule.name}
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{schedule.scheduleType === "daily" && "Daily"}
								{schedule.scheduleType === "weekly" && "Weekly"}
								{schedule.scheduleType === "custom" && "Custom"}
								{schedule.scheduleType === "one-time" && "One-Time"}
							</p>
						</div>
						<span
							className={cn(
								"px-2 py-1 rounded text-xs font-medium",
								schedule.isActive
									? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
							)}
						>
							{schedule.isActive ? "Active" : "Paused"}
						</span>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-600 dark:text-gray-400">
							{schedule.totalPublished} published
						</span>
						{schedule.nextPublishAt && (
							<span className="text-blue-600 dark:text-blue-400">
								Next: {format(schedule.nextPublishAt, "MMM d")}
							</span>
						)}
					</div>
				</button>
			))}
		</div>
	);
}
