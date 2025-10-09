'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StravaActivity } from '@/types';
import { fetchActivities } from '@/services/api';
import { COLORS } from '@/constants';

interface DayActivity {
  date: string;
  activities: StravaActivity[];
  totalCalories: number;
  primaryType: string;
  count: number;
}

const ACTIVITY_COLORS: Record<string, string> = {
  Run: COLORS.PRIMARY,
  Ride: COLORS.SECONDARY,
  Walk: COLORS.WARNING,
  Hike: COLORS.SUCCESS,
};

function getWeeksInYear(year: number): Date[][] {
  const weeks: Date[][] = [];
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

  // Start from the first Sunday before or on Jan 1
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const currentDate = new Date(startDate);

  while (currentDate <= lastDay || weeks.length < 53) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);

    // Stop after we've passed the end of the year
    if (currentDate.getFullYear() > year) break;
  }

  return weeks;
}

export default function ActivityHeatmap() {
  const currentYear = new Date().getFullYear();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const { data: activities, error, isLoading } = useSWR<StravaActivity[]>(
    '/api/strava/activities',
    fetchActivities,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
        <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !activities) {
    return null;
  }

  // Group activities by date
  const activityMap = new Map<string, DayActivity>();

  activities.forEach((activity) => {
    const date = new Date(activity.start_date).toDateString();
    const existing = activityMap.get(date);

    // Estimate calories: rough calculation based on activity type and distance
    const caloriesPerMile: Record<string, number> = {
      Run: 100,
      Walk: 60,
      Hike: 80,
      Ride: 50,
    };

    const distanceInMiles = activity.distance * 0.000621371;
    const calories = (caloriesPerMile[activity.type] || 70) * distanceInMiles;

    if (existing) {
      existing.activities.push(activity);
      existing.totalCalories += calories;
      existing.count += 1;

      // Update primary type to the one with most calories
      const typeCalories: Record<string, number> = {};
      existing.activities.forEach(a => {
        const dist = a.distance * 0.000621371;
        const cal = (caloriesPerMile[a.type] || 70) * dist;
        typeCalories[a.type] = (typeCalories[a.type] || 0) + cal;
      });

      existing.primaryType = Object.entries(typeCalories).sort((a, b) => b[1] - a[1])[0][0];
    } else {
      activityMap.set(date, {
        date,
        activities: [activity],
        totalCalories: calories,
        primaryType: activity.type,
        count: 1,
      });
    }
  });

  const weeks = getWeeksInYear(currentYear);
  const maxCalories = Math.max(...Array.from(activityMap.values()).map(d => d.totalCalories), 1);

  const getDayColor = (day: Date): string => {
    const dateStr = day.toDateString();
    const dayData = activityMap.get(dateStr);

    if (!dayData) return '#ebedf0';

    const color = ACTIVITY_COLORS[dayData.primaryType] || COLORS.PRIMARY;
    const intensity = Math.min(dayData.totalCalories / maxCalories, 1);

    // Convert hex to rgba with opacity
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Min opacity 0.2, max 1.0
    const opacity = 0.2 + (intensity * 0.8);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getDayData = (day: Date): DayActivity | null => {
    return activityMap.get(day.toDateString()) || null;
  };

  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === new Date().getMonth();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Activity Calendar {currentYear}</h3>
        </div>

        {/* Activity Type Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-gray-600 dark:text-gray-400">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Month labels */}
          <div className="grid gap-1 pl-14 mb-1" style={{ 
            gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
            maxWidth: '100%'
          }}>
            {weeks.map((week, weekIdx) => {
              const firstDay = week[0];
              const prevWeek = weeks[weekIdx - 1];
              const showMonth = weekIdx === 0 || (prevWeek && prevWeek[0].getMonth() !== firstDay.getMonth());
              return (
                <div key={weekIdx} className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  {showMonth ? firstDay.toLocaleDateString('en-US', { month: 'short' }) : ''}
                </div>
              );
            })}
          </div>

          <div className="grid gap-1" style={{ 
            gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)`,
            maxWidth: '100%'
          }}>
            {/* Day labels */}
            <div className="flex flex-col justify-around text-xs text-gray-500 dark:text-gray-400 pr-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} className="flex items-center" style={{ height: 'calc(100% / 7)' }}>
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* Heatmap grid - each week column */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                {week.map((day, dayIdx) => {
                  const dayData = getDayData(day);
                  const dateStr = day.toDateString();
                  const isToday = dateStr === new Date().toDateString();
                  const isFuture = day > new Date();

                  return (
                    <div
                      key={dayIdx}
                      className={`rounded-sm transition-all duration-200 cursor-pointer aspect-square ${
                        isToday ? 'ring-2 ring-primary-500' : ''
                      } ${hoveredDay === dateStr ? 'scale-125 z-10' : ''}`}
                      style={{
                        backgroundColor: isFuture ? '#f5f5f5' : getDayColor(day),
                        opacity: !isCurrentMonth(day) && !dayData ? 0.3 : 1,
                        minWidth: '8px',
                        minHeight: '8px',
                      }}
                      onMouseEnter={(e) => {
                        setHoveredDay(dateStr);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPosition({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredDay(null);
                        setTooltipPosition(null);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && activityMap.get(hoveredDay) && tooltipPosition && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 p-3 max-w-xs">
            <p className="text-sm font-semibold mb-2">
              {new Date(hoveredDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <div className="space-y-1">
              {activityMap.get(hoveredDay)?.activities.map((activity, idx) => (
                <div key={idx} className="text-xs flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: activity.type === 'Run' ? '#fc4c02' :
                                     activity.type === 'Ride' ? '#87CEEB' :
                                     activity.type === 'Walk' ? '#f59e0b' : '#22c55e'
                    }}
                  />
                  <span className="text-gray-200">
                    {activity.type}: {(activity.distance * 0.000621371).toFixed(2)} mi
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                ~{Math.round(activityMap.get(hoveredDay)!.totalCalories)} calories
              </p>
            </div>
            {/* Tooltip arrow */}
            <div
              className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900 dark:border-t-gray-800"
            />
          </div>
        </div>
      )}

    </div>
  );
}
