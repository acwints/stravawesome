'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Constants
const COLORS = {
  PRIMARY: '#fc4c02',    // Strava orange
  SECONDARY: '#87CEEB',  // Light blue
  DARK: '#100333',       // Dark purple
  DARKER: '#0A0221',     // Darker purple for gradient
  CARD_BG: 'rgba(26, 26, 31, 0.7)', // Semi-transparent dark for cards
} as const;

// Types
interface ActivityData {
  week: string;
  running?: number;
  walking?: number;
  cycling?: number;
  indoor?: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    running: ActivityData[];
    cycling: ActivityData[];
  };
}

interface SportTotal {
  name: string;
  value: number;
  fill: string;
}

interface ProcessedActivityData extends ActivityData {
  id: string;
}

// Components
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-strava-navy p-4 rounded-lg shadow-lg border border-strava-gray">
        <p className="text-strava-light font-medium">Week of {label}</p>
        {payload.map((entry, index) => (
          <p 
            key={index} 
            className="font-bold"
            style={{ color: entry.color }}
          >
            {entry.name}: {Math.round(entry.value)} miles
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Helper function to calculate nice y-axis ticks
function calculateYAxisDomain(data: ActivityData[], keys: string[]): [number, number] {
  const maxValue = Math.max(...data.map(d => 
    keys.reduce((sum, key) => sum + (d[key as keyof ActivityData] as number || 0), 0)
  ));
  const niceMax = Math.ceil(maxValue / 5) * 5; // Round up to nearest 5
  return [0, niceMax];
}

// Wrap the charts in a client-only component
function Charts({ data, year, setYear }: { 
  data: ChartData | null; 
  year: number; 
  setYear: (year: number) => void;
}) {
  const [processedRunningData, setProcessedRunningData] = useState<ProcessedActivityData[]>([]);
  const [processedCyclingData, setProcessedCyclingData] = useState<ProcessedActivityData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data) {
      const runningData = data.datasets.running.map((item, index) => ({
        ...item,
        id: `running-${year}-${index}-${item.week}`,
      }));
      setProcessedRunningData(runningData);

      const cyclingData = data.datasets.cycling.map((item, index) => ({
        ...item,
        id: `cycling-${year}-${index}-${item.week}`,
      }));
      setProcessedCyclingData(cyclingData);
    }
  }, [data, year]);

  if (!mounted) return null;
  if (!data) return null;

  const runningData = data.datasets.running;
  const cyclingData = data.datasets.cycling;

  const totalRunning = Math.round(
    runningData.reduce((acc, curr) => acc + (curr.running || 0), 0)
  );
  const totalWalking = Math.round(
    runningData.reduce((acc, curr) => acc + (curr.walking || 0), 0)
  );
  const totalOutdoorCycling = Math.round(
    cyclingData.reduce((acc, curr) => acc + (curr.cycling || 0), 0)
  );
  const totalIndoorCycling = Math.round(
    cyclingData.reduce((acc, curr) => acc + (curr.indoor || 0), 0)
  );

  const totalCycling = totalOutdoorCycling + totalIndoorCycling;

  const sportTotals: SportTotal[] = [
    { name: 'Running', value: totalRunning, fill: COLORS.PRIMARY },
    { name: 'Walking', value: totalWalking, fill: COLORS.SECONDARY },
    { name: 'Outdoor Cycling', value: totalOutdoorCycling, fill: COLORS.PRIMARY },
    { name: 'Indoor Cycling', value: totalIndoorCycling, fill: COLORS.SECONDARY },
  ].sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...sportTotals.map(sport => sport.value));

  const [runningMin, runningMax] = calculateYAxisDomain(runningData, ['running', 'walking']);
  const [cyclingMin, cyclingMax] = calculateYAxisDomain(cyclingData, ['cycling', 'indoor']);

  const chartProps = {
    maxBarSize: 50,
    margin: { top: 20, right: 30, left: 40, bottom: 90 },
  };

  const xAxisProps = {
    dataKey: "week",
    stroke: "#f7f7fa",
    height: 60,
    angle: -45,
    textAnchor: "end",
    tick: { fill: '#f7f7fa', fontSize: 12 },
    tickLine: false,
    axisLine: false,
    dy: 20,
    dx: 10,
    type: "category" as const,
    allowDuplicatedCategory: false
  };

  return (
    <div className="container mx-auto space-y-8 px-4">
      {/* Year Navigation */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <button
          onClick={() => setYear(2024)}
          className={`px-6 py-3 rounded-lg transition-all transform hover:scale-105 text-lg ${
            year === 2024 
              ? 'bg-gradient-to-r from-strava-orange to-orange-500 text-white shadow-lg' 
              : 'bg-strava-navy text-strava-light hover:bg-opacity-80'
          }`}
          disabled={year === 2024}
        >
          2024
        </button>
        <button
          onClick={() => setYear(2025)}
          className={`px-6 py-3 rounded-lg transition-all transform hover:scale-105 text-lg ${
            year === 2025 
              ? 'bg-gradient-to-r from-strava-orange to-orange-500 text-white shadow-lg' 
              : 'bg-strava-navy text-strava-light hover:bg-opacity-80'
          }`}
          disabled={year === 2025}
        >
          2025
        </button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-4 gap-4">
        {sportTotals.map((sport, index) => (
          <div key={index} 
            className="backdrop-blur-md rounded-lg shadow-lg border border-opacity-10 border-white"
            style={{ background: COLORS.CARD_BG }}
          >
            <div className="text-center p-6">
              <h3 className="text-strava-light font-medium mb-2">{sport.name}</h3>
              <p className="text-4xl font-bold mb-1" style={{ color: sport.fill }}>{sport.value}</p>
              <p className="text-sm text-strava-light">miles</p>
            </div>
          </div>
        ))}
      </div>

      {/* Running Chart */}
      <div className="backdrop-blur-md rounded-lg shadow-lg border border-opacity-10 border-white p-6"
        style={{ background: COLORS.CARD_BG }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-strava-light">Weekly Running & Walking Distance</h2>
          <div className="text-strava-light">
            <span className="text-sm">Total: </span>
            <span className="text-2xl font-bold text-strava-orange">{totalRunning}</span>
            <span className="text-sm ml-1">miles</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={processedRunningData} 
              {...chartProps}
              key={`running-chart-${year}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" key={`running-grid-${year}`} />
              <XAxis 
                {...xAxisProps} 
                key={`running-xaxis-${year}`}
                ticks={processedRunningData.map(d => d.week)}
              />
              <YAxis 
                stroke="#f7f7fa"
                tick={{ fill: '#f7f7fa' }}
                domain={[runningMin, runningMax]}
                ticks={Array.from({ length: 6 }, (_, i) => runningMin + (i * (runningMax - runningMin) / 5))}
                key={`running-yaxis-${year}`}
              />
              <Tooltip content={<CustomTooltip />} key={`running-tooltip-${year}`} />
              <Bar
                dataKey="running"
                fill={COLORS.PRIMARY}
                radius={[4, 4, 0, 0]}
                name="Running"
                stackId="a"
                key={`running-bar-${year}`}
              />
              <Bar
                dataKey="walking"
                fill={COLORS.SECONDARY}
                radius={[4, 4, 0, 0]}
                name="Walking"
                stackId="a"
                key={`walking-bar-${year}`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cycling Chart */}
      <div className="backdrop-blur-md rounded-lg shadow-lg border border-opacity-10 border-white p-6"
        style={{ background: COLORS.CARD_BG }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-strava-light">Weekly Cycling Distance</h2>
          <div className="text-strava-light">
            <span className="text-sm">Total: </span>
            <span className="text-2xl font-bold text-strava-orange">{totalCycling}</span>
            <span className="text-sm ml-1">miles</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={processedCyclingData} 
              {...chartProps}
              key={`cycling-chart-${year}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" key={`cycling-grid-${year}`} />
              <XAxis 
                {...xAxisProps} 
                key={`cycling-xaxis-${year}`}
                ticks={processedCyclingData.map(d => d.week)}
              />
              <YAxis 
                stroke="#f7f7fa"
                tick={{ fill: '#f7f7fa' }}
                domain={[cyclingMin, cyclingMax]}
                ticks={Array.from({ length: 6 }, (_, i) => cyclingMin + (i * (cyclingMax - cyclingMin) / 5))}
                key={`cycling-yaxis-${year}`}
              />
              <Tooltip content={<CustomTooltip />} key={`cycling-tooltip-${year}`} />
              <Bar
                dataKey="cycling"
                fill={COLORS.PRIMARY}
                radius={[4, 4, 0, 0]}
                name="Outdoor Cycling"
                stackId="a"
                key={`cycling-bar-${year}`}
              />
              <Bar
                dataKey="indoor"
                fill={COLORS.SECONDARY}
                radius={[4, 4, 0, 0]}
                name="Indoor Cycling"
                stackId="a"
                key={`indoor-bar-${year}`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function ActivityCharts() {
  const { data: session } = useSession();
  const [year, setYear] = useState(2024);
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      try {
        const response = await fetch(`/api/strava/activities?year=${year}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [year]);

  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${COLORS.DARKER} 0%, ${COLORS.DARK} 100%)`,
      minHeight: '100vh'
    }}>
      <Header />
      <div className="pt-40 pb-20">
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-strava-orange"></div>
          </div>
        ) : (
          <Charts data={data} year={year} setYear={setYear} />
        )}
      </div>
      <Footer />
    </div>
  );
} 