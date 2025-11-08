"use client";

import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface TimelineEvent {
	id: string;
	sceneId?: string;
	chapterId?: string;
	title: string;
	date: Date;
	status: "published" | "scheduled" | "pending" | "failed";
	type: "scene" | "chapter";
}

interface PublishTimelineProps {
	events: TimelineEvent[];
	startDate?: Date;
	endDate?: Date;
	onEventClick?: (event: TimelineEvent) => void;
	onDateClick?: (date: Date) => void;
	onReschedule?: (eventId: string, newDate: Date) => void;
}

export function PublishTimeline({
	events,
	startDate = new Date(),
	endDate,
	onEventClick,
	onDateClick,
	onReschedule,
}: PublishTimelineProps) {
	const [currentMonth, setCurrentMonth] = useState(startDate);
	const [viewMode, setViewMode] = useState<"calendar" | "timeline">("calendar");
	const [draggedEvent, setDraggedEvent] = useState<TimelineEvent | null>(null);

	// Generate calendar days
	const calendarDays = useMemo(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const calendarStart = startOfWeek(monthStart);
		const calendarEnd = endOfWeek(monthEnd);

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	}, [currentMonth]);

	// Group events by date
	const eventsByDate = useMemo(() => {
		const grouped = new Map<string, TimelineEvent[]>();

		events.forEach((event) => {
			const dateKey = format(event.date, "yyyy-MM-dd");
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, []);
			}
			grouped.get(dateKey)!.push(event);
		});

		return grouped;
	}, [events]);

	const handleDragStart = (event: TimelineEvent) => {
		setDraggedEvent(event);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (date: Date) => {
		if (draggedEvent && onReschedule) {
			onReschedule(draggedEvent.id, date);
			setDraggedEvent(null);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "published":
				return "bg-green-500 dark:bg-green-600";
			case "scheduled":
				return "bg-blue-500 dark:bg-blue-600";
			case "pending":
				return "bg-yellow-500 dark:bg-yellow-600";
			case "failed":
				return "bg-red-500 dark:bg-red-600";
			default:
				return "bg-gray-500 dark:bg-gray-600";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "published":
				return "✅";
			case "scheduled":
				return "📅";
			case "pending":
				return "⏳";
			case "failed":
				return "❌";
			default:
				return "📝";
		}
	};

	const nextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
		);
	};

	const prevMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
		);
	};

	const today = new Date();

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
			{/* Header */}
			<div className="p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						Publishing Timeline
					</h2>

					{/* View Mode Toggle */}
					<div className="flex gap-2">
						<button
							onClick={() => setViewMode("calendar")}
							className={cn(
								"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
								viewMode === "calendar"
									? "bg-blue-600 text-white"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
							)}
						>
							Calendar
						</button>
						<button
							onClick={() => setViewMode("timeline")}
							className={cn(
								"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
								viewMode === "timeline"
									? "bg-blue-600 text-white"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
							)}
						>
							Timeline
						</button>
					</div>
				</div>

				{/* Month Navigation */}
				<div className="flex items-center justify-between">
					<button
						onClick={prevMonth}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						← Previous
					</button>

					<h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{format(currentMonth, "MMMM yyyy")}
					</h3>

					<button
						onClick={nextMonth}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						Next →
					</button>
				</div>
			</div>

			{/* Calendar View */}
			{viewMode === "calendar" && (
				<div className="p-6">
					{/* Week day headers */}
					<div className="grid grid-cols-7 gap-2 mb-2">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
							<div
								key={day}
								className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
							>
								{day}
							</div>
						))}
					</div>

					{/* Calendar grid */}
					<div className="grid grid-cols-7 gap-2">
						{calendarDays.map((day) => {
							const dateKey = format(day, "yyyy-MM-dd");
							const dayEvents = eventsByDate.get(dateKey) || [];
							const isToday = isSameDay(day, today);
							const isCurrentMonth = isSameMonth(day, currentMonth);

							return (
								<div
									key={day.toISOString()}
									className={cn(
										"min-h-[100px] p-2 rounded-lg border-2 transition-colors",
										isCurrentMonth
											? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
											: "border-transparent bg-gray-50 dark:bg-gray-900",
										isToday && "border-blue-500 dark:border-blue-400",
										"hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer",
									)}
									onClick={() => onDateClick?.(day)}
									onDragOver={handleDragOver}
									onDrop={() => handleDrop(day)}
								>
									{/* Date number */}
									<div
										className={cn(
											"text-sm font-medium mb-1",
											isCurrentMonth
												? "text-gray-900 dark:text-gray-100"
												: "text-gray-400 dark:text-gray-600",
											isToday && "text-blue-600 dark:text-blue-400 font-bold",
										)}
									>
										{format(day, "d")}
									</div>

									{/* Events */}
									<div className="space-y-1">
										{dayEvents.slice(0, 3).map((event) => (
											<div
												key={event.id}
												draggable
												onDragStart={() => handleDragStart(event)}
												onClick={(e) => {
													e.stopPropagation();
													onEventClick?.(event);
												}}
												className={cn(
													"text-xs px-2 py-1 rounded text-white truncate cursor-move",
													getStatusColor(event.status),
												)}
												title={event.title}
											>
												{getStatusIcon(event.status)} {event.title}
											</div>
										))}
										{dayEvents.length > 3 && (
											<div className="text-xs text-gray-500 dark:text-gray-400 px-2">
												+{dayEvents.length - 3} more
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Timeline View (Gantt-style) */}
			{viewMode === "timeline" && (
				<div className="p-6 overflow-x-auto">
					<TimelineGantt
						events={events}
						startDate={startDate}
						endDate={endDate || addDays(startDate, 90)}
						onEventClick={onEventClick}
					/>
				</div>
			)}

			{/* Legend */}
			<div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
				<div className="flex flex-wrap gap-4 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 rounded bg-green-500" />
						<span className="text-gray-700 dark:text-gray-300">Published</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 rounded bg-blue-500" />
						<span className="text-gray-700 dark:text-gray-300">Scheduled</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 rounded bg-yellow-500" />
						<span className="text-gray-700 dark:text-gray-300">Pending</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 rounded bg-red-500" />
						<span className="text-gray-700 dark:text-gray-300">Failed</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Gantt-style timeline component
function TimelineGantt({
	events,
	startDate,
	endDate,
	onEventClick,
}: {
	events: TimelineEvent[];
	startDate: Date;
	endDate: Date;
	onEventClick?: (event: TimelineEvent) => void;
}) {
	const days = eachDayOfInterval({ start: startDate, end: endDate });
	const totalDays = days.length;

	return (
		<div className="min-w-[800px]">
			{/* Timeline header */}
			<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
				<div className="w-48 flex-shrink-0 font-semibold text-gray-900 dark:text-gray-100">
					Content
				</div>
				<div
					className="flex-1 grid"
					style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}
				>
					{days.map((day, index) => (
						<div
							key={index}
							className="text-center text-xs text-gray-600 dark:text-gray-400 px-1"
						>
							{format(day, "d")}
						</div>
					))}
				</div>
			</div>

			{/* Timeline rows */}
			<div className="space-y-2">
				{events.map((event) => {
					const eventDate = event.date;
					const dayIndex = days.findIndex((day) => isSameDay(day, eventDate));

					if (dayIndex === -1) return null;

					return (
						<div key={event.id} className="flex items-center">
							<div className="w-48 flex-shrink-0 text-sm text-gray-700 dark:text-gray-300 pr-4 truncate">
								{event.title}
							</div>
							<div
								className="flex-1 grid relative"
								style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}
							>
								<div
									className={cn(
										"absolute h-6 rounded cursor-pointer",
										getStatusColor(event.status),
										"hover:opacity-80 transition-opacity",
									)}
									style={{
										left: `${(dayIndex / totalDays) * 100}%`,
										width: `${(1 / totalDays) * 100}%`,
									}}
									onClick={() => onEventClick?.(event)}
									title={`${event.title} - ${format(eventDate, "MMM d, yyyy")}`}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);

	function getStatusColor(status: string) {
		switch (status) {
			case "published":
				return "bg-green-500";
			case "scheduled":
				return "bg-blue-500";
			case "pending":
				return "bg-yellow-500";
			case "failed":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	}
}
