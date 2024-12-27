export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  stravaId?: number;
  stravaTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export interface DashboardStats {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
} 