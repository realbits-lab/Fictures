'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface ScheduleBuilderProps {
  storyId: string;
  chapterId?: string;
  totalScenes: number;
  onComplete?: () => void;
}

export function ScheduleBuilder({
  storyId,
  chapterId,
  totalScenes,
  onComplete,
}: ScheduleBuilderProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    scheduleType: 'daily' as 'daily' | 'weekly' | 'custom' | 'one-time',
    startDate: '',
    endDate: '',
    publishTime: '09:00',
    intervalDays: 1,
    daysOfWeek: [] as number[],
    scenesPerPublish: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPublications, setEstimatedPublications] = useState(0);

  // Calculate estimated publications
  const calculateEstimate = () => {
    const { scheduleType, startDate, endDate, intervalDays, daysOfWeek, scenesPerPublish } = formData;

    if (!startDate) return 0;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let publications = 0;

    switch (scheduleType) {
      case 'daily':
        publications = diffDays;
        break;
      case 'weekly':
        const weeksInRange = Math.floor(diffDays / 7);
        publications = weeksInRange * daysOfWeek.length;
        break;
      case 'custom':
        publications = Math.floor(diffDays / intervalDays);
        break;
      case 'one-time':
        publications = 1;
        break;
    }

    const totalPublications = Math.min(publications, Math.ceil(totalScenes / scenesPerPublish));
    setEstimatedPublications(totalPublications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/publish/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          chapterId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }

      const { scheduleId } = await response.json();

      toast.success('Publishing schedule created!');
      onComplete?.();
      router.refresh();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => {
      const daysOfWeek = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort();
      return { ...prev, daysOfWeek };
    });
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Create Publishing Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Automate your publishing workflow with a custom schedule for {totalScenes} scenes.
        </p>
      </div>

      {/* Schedule Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Schedule Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="e.g., Weekly Chapter Release"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
          placeholder="Add notes about this schedule..."
        />
      </div>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Schedule Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'daily', label: 'Daily', desc: 'Publish every day' },
            { value: 'weekly', label: 'Weekly', desc: 'Specific days' },
            { value: 'custom', label: 'Custom', desc: 'Every N days' },
            { value: 'one-time', label: 'One-Time', desc: 'Single date' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, scheduleType: type.value as any })}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                formData.scheduleType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              )}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{type.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Days of Week (Weekly only) */}
      {formData.scheduleType === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Days of Week
          </label>
          <div className="flex gap-2">
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDayOfWeek(day.value)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-colors',
                  formData.daysOfWeek.includes(day.value)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interval Days (Custom only) */}
      {formData.scheduleType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Publish Every N Days
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={formData.intervalDays}
            onChange={(e) => setFormData({ ...formData, intervalDays: parseInt(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              setFormData({ ...formData, startDate: e.target.value });
              calculateEstimate();
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {formData.scheduleType !== 'one-time' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => {
                setFormData({ ...formData, endDate: e.target.value });
                calculateEstimate();
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>

      {/* Publish Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Publish Time
        </label>
        <input
          type="time"
          value={formData.publishTime}
          onChange={(e) => setFormData({ ...formData, publishTime: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      {/* Scenes Per Publish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scenes Per Publication
        </label>
        <input
          type="number"
          min="1"
          max={totalScenes}
          value={formData.scenesPerPublish}
          onChange={(e) => {
            setFormData({ ...formData, scenesPerPublish: parseInt(e.target.value) });
            calculateEstimate();
          }}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How many scenes to publish each time
        </p>
      </div>

      {/* Estimate */}
      {estimatedPublications > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Estimated:</strong> {estimatedPublications} publications will be scheduled
            {formData.endDate && ` from ${formData.startDate} to ${formData.endDate}`}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Create Schedule'
          )}
        </button>
      </div>
    </form>
  );
}
