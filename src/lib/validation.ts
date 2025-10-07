/**
 * Runtime validation utilities for data integrity
 */

import { logger } from './logger';

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validates that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates activity type
 */
export function isValidActivityType(type: string): boolean {
  const validTypes = [
    'Run',
    'Ride',
    'Swim',
    'Walk',
    'Hike',
    'AlpineSki',
    'BackcountrySki',
    'Canoeing',
    'Crossfit',
    'EBikeRide',
    'Elliptical',
    'Golf',
    'Handcycle',
    'IceSkate',
    'InlineSkate',
    'Kayaking',
    'Kitesurf',
    'NordicSki',
    'RockClimbing',
    'RollerSki',
    'Rowing',
    'Snowboard',
    'Snowshoe',
    'Soccer',
    'StairStepper',
    'StandUpPaddling',
    'Surfing',
    'VirtualRide',
    'VirtualRun',
    'WeightTraining',
    'Wheelchair',
    'Windsurf',
    'Workout',
    'Yoga'
  ];
  return validTypes.includes(type);
}

/**
 * Type guard for checking if an object has required properties
 */
export function hasRequiredProperties<T>(
  obj: unknown,
  properties: (keyof T)[]
): obj is T {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  return properties.every(prop => prop in obj);
}

/**
 * Validates environment variables at runtime
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }
}

/**
 * Validates a Strava activity object
 */
export function isValidStravaActivity(activity: unknown): boolean {
  return (
    hasRequiredProperties(activity, ['id', 'name', 'type', 'distance']) &&
    isPositiveNumber(activity.id) &&
    isNonEmptyString(activity.name) &&
    isValidActivityType(activity.type) &&
    typeof activity.distance === 'number'
  );
}

/**
 * Validates a goal object
 */
export interface GoalInput {
  activityType: string;
  targetDistance: number;
}

export function isValidGoal(goal: unknown): goal is GoalInput {
  return (
    hasRequiredProperties<GoalInput>(goal, ['activityType', 'targetDistance']) &&
    isValidActivityType(goal.activityType) &&
    isPositiveNumber(goal.targetDistance)
  );
}

/**
 * Validates an array of goals
 */
export function areValidGoals(goals: unknown): goals is GoalInput[] {
  return Array.isArray(goals) && goals.every(isValidGoal);
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.warn('Failed to parse JSON', { error, json: json.substring(0, 100) });
    return fallback;
  }
}

/**
 * Validates and sanitizes pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export function validatePagination(
  page: unknown,
  limit: unknown,
  maxLimit: number = 100
): PaginationParams {
  const validPage = isPositiveNumber(page) ? Math.floor(page) : 1;
  const validLimit = isPositiveNumber(limit)
    ? Math.min(Math.floor(limit), maxLimit)
    : 10;

  return { page: validPage, limit: validLimit };
}
