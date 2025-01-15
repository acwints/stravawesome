import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { Goal, StravaActivity } from '@/types';
import { ACTIVITY_TYPES, METERS_TO_MILES, CURRENT_YEAR } from '@/constants';
import { fetchGoals, updateGoals } from '@/services/api';
import { GoalsSkeleton } from './ui/Skeleton';

export default function GoalsProgress({ activities }: { activities: StravaActivity[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableGoals, setEditableGoals] = useState<Goal[]>([]);
  
  const { data: goals, error, mutate, isLoading } = useSWR<Goal[]>('/api/goals', fetchGoals, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  if (error) {
    toast.error('Failed to load goals');
    return null;
  }

  if (isLoading || !goals) {
    return <GoalsSkeleton />;
  }

  // Calculate annual progress from activities
  const progress = activities.reduce((acc: { [key: string]: number }, activity) => {
    const activityDate = new Date(activity.start_date);
    const activityYear = activityDate.getFullYear();
    
    if (activityYear !== CURRENT_YEAR) return acc;

    const matchingType = ACTIVITY_TYPES.find(t => t.stravaType === activity.type);
    if (!matchingType) return acc;

    const distanceInMiles = activity.distance * METERS_TO_MILES;
    
    if (!acc[matchingType.type]) acc[matchingType.type] = 0;
    acc[matchingType.type] += distanceInMiles;
    return acc;
  }, {});

  async function handleSaveGoals() {
    try {
      const goalsToUpdate = editableGoals.map(({ activityType, targetDistance }) => ({
        activityType,
        targetDistance
      }));
      const updatedGoals = await updateGoals(goalsToUpdate);
      await mutate(updatedGoals);
      setIsEditing(false);
      toast.success('Goals updated successfully');
    } catch (error) {
      toast.error('Failed to update goals');
      console.error('Error saving goals:', error);
    }
  }

  function handleEditGoal(activityType: string, value: string) {
    const numericValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numericValue)) return;

    const existingGoalIndex = editableGoals.findIndex(g => g.activityType === activityType);
    
    if (existingGoalIndex >= 0) {
      const newGoals = [...editableGoals];
      newGoals[existingGoalIndex] = {
        ...newGoals[existingGoalIndex],
        targetDistance: numericValue
      };
      setEditableGoals(newGoals);
    } else {
      setEditableGoals([
        ...editableGoals,
        {
          activityType,
          targetDistance: numericValue,
          year: CURRENT_YEAR,
          userId: ''
        }
      ]);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{CURRENT_YEAR} Goals Progress</h2>
          <p className="text-sm text-gray-600 mt-1">Track your annual activity goals</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => {
              setIsEditing(true);
              const initialGoals = [...goals];
              ACTIVITY_TYPES.forEach(({ type }) => {
                if (!initialGoals.find(g => g.activityType === type)) {
                  initialGoals.push({ activityType: type, targetDistance: 0, year: CURRENT_YEAR, userId: '' });
                }
              });
              setEditableGoals(initialGoals);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Goals
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSaveGoals}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditableGoals(goals);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIVITY_TYPES.map(({ type, label, color }) => {
          const goal = (isEditing ? editableGoals : goals).find(g => g.activityType === type) || 
            { activityType: type, targetDistance: 0, year: CURRENT_YEAR, userId: '' };
          const currentProgress = progress[type] || 0;
          const percentComplete = goal.targetDistance ? (currentProgress / goal.targetDistance) * 100 : 0;

          return (
            <div key={type} className="bg-gray-50 rounded-lg p-4 transition-all duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={goal.targetDistance || ''}
                    onChange={(e) => handleEditGoal(type, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                    placeholder="0"
                  />
                  <span className="text-gray-600">mi</span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{currentProgress.toFixed(1)} / {goal.targetDistance.toFixed(1)} mi</span>
                    <span>{Math.round(percentComplete)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(percentComplete, 100)}%`,
                        backgroundColor: percentComplete >= 100 ? '#22c55e' : color
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 