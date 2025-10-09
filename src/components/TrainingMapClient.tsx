'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { StravaActivity } from '@/types';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { METERS_TO_MILES } from '@/constants';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Decode Google's encoded polyline format
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Get vibrant color based on activity type - enhanced for dark map
function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    Run: '#ff3366',      // Hot pink/red - pops on dark background
    Ride: '#00d4ff',     // Bright cyan - electric blue
    Walk: '#ffcc00',     // Bright yellow/gold
    Hike: '#00ff88',     // Bright green/mint
  };
  return colors[type] || '#ff3366';
}

interface TrainingMapClientProps {
  activities: StravaActivity[];
}

export default function TrainingMapClient({ activities }: TrainingMapClientProps) {
  useEffect(() => {
    // Fix for default markers in react-leaflet (client-side only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Filter activities that have location data
  const activitiesWithLocation = activities.filter(
    (activity) => activity.start_latlng && activity.start_latlng.length === 2
  );

  // Filter activities that have route data (polylines)
  const activitiesWithRoutes = activities.filter(
    (activity) => activity.map?.summary_polyline
  );

  if (activitiesWithLocation.length === 0 && activitiesWithRoutes.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Training Routes</h3>
        <p className="text-gray-600 dark:text-gray-400">No activities with location data found.</p>
      </div>
    );
  }

  // Smart map center calculation
  // Strategy: Use most recent activity location, or calculate centroid of recent activities
  const getMapCenter = (): { center: L.LatLngExpression; zoom: number } | { bounds: L.LatLngBounds } => {
    // Get the 5 most recent activities with location data
    const recentActivities = [...activitiesWithLocation]
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      .slice(0, 5);

    if (recentActivities.length === 0) {
      // Fallback to routes if no start locations
      if (activitiesWithRoutes.length > 0) {
        const firstRoute = activitiesWithRoutes[0];
        if (firstRoute.map?.summary_polyline) {
          const routePoints = decodePolyline(firstRoute.map.summary_polyline);
          return { center: routePoints[0], zoom: 13 };
        }
      }
      // Ultimate fallback
      return { center: [40.7128, -74.0060] as L.LatLngExpression, zoom: 10 };
    }

    if (recentActivities.length === 1) {
      // Single activity - center on it with good zoom
      return { center: recentActivities[0].start_latlng! as L.LatLngExpression, zoom: 13 };
    }

    // Multiple recent activities - calculate centroid
    const latSum = recentActivities.reduce((sum, a) => sum + a.start_latlng![0], 0);
    const lngSum = recentActivities.reduce((sum, a) => sum + a.start_latlng![1], 0);
    const centroid: L.LatLngExpression = [
      latSum / recentActivities.length,
      lngSum / recentActivities.length
    ];

    // Calculate approximate zoom based on spread of points
    const lats = recentActivities.map(a => a.start_latlng![0]);
    const lngs = recentActivities.map(a => a.start_latlng![1]);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    // Determine zoom level based on spread
    let zoom = 13;
    if (maxRange > 1) zoom = 9;      // Very spread out
    else if (maxRange > 0.5) zoom = 10;
    else if (maxRange > 0.2) zoom = 11;
    else if (maxRange > 0.1) zoom = 12;

    return { center: centroid, zoom };
  };

  const mapConfig = getMapCenter();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Training Routes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {activitiesWithRoutes.length} routes shown
            </p>
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#ff3366', boxShadow: '0 0 8px #ff3366' }} />
              <span className="text-gray-600 dark:text-gray-400">Run</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />
              <span className="text-gray-600 dark:text-gray-400">Ride</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#ffcc00', boxShadow: '0 0 8px #ffcc00' }} />
              <span className="text-gray-600 dark:text-gray-400">Walk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
              <span className="text-gray-600 dark:text-gray-400">Hike</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[600px] w-full">
        <MapContainer
          center={'center' in mapConfig ? mapConfig.center : undefined}
          zoom={'zoom' in mapConfig ? mapConfig.zoom : undefined}
          bounds={'bounds' in mapConfig ? mapConfig.bounds : undefined}
          boundsOptions={{ padding: [30, 30] }}
          className="h-full w-full"
        >
          {/* Dark mode map tiles - better contrast for routes */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />

          {/* Draw route polylines */}
          {activitiesWithRoutes.map((activity) => {
            if (!activity.map?.summary_polyline) return null;

            const routePoints = decodePolyline(activity.map.summary_polyline);
            const color = getActivityColor(activity.type);

            return (
              <Polyline
                key={`route-${activity.id}`}
                positions={routePoints}
                pathOptions={{
                  color: color,
                  weight: 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                className="route-line hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-gray-900 mb-1">{activity.name || 'Untitled Activity'}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Type:</strong> {activity.type}</p>
                      <p><strong>Distance:</strong> {(activity.distance * METERS_TO_MILES).toFixed(1)} mi</p>
                      <p><strong>Date:</strong> {formatDistanceToNow(new Date(activity.start_date), { addSuffix: true })}</p>
                      {activity.moving_time && (
                        <p><strong>Duration:</strong> {Math.floor(activity.moving_time / 60)} min</p>
                      )}
                      {activity.total_elevation_gain && (
                        <p><strong>Elevation:</strong> {Math.round(activity.total_elevation_gain * 3.28084)} ft</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Add start markers for activities without routes */}
          {activitiesWithLocation
            .filter((activity) => !activity.map?.summary_polyline)
            .map((activity) => (
              <Marker
                key={`marker-${activity.id}`}
                position={[activity.start_latlng![0], activity.start_latlng![1]]}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-gray-900 mb-1">{activity.name || 'Untitled Activity'}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Type:</strong> {activity.type}</p>
                      <p><strong>Distance:</strong> {(activity.distance * METERS_TO_MILES).toFixed(1)} mi</p>
                      <p><strong>Date:</strong> {formatDistanceToNow(new Date(activity.start_date), { addSuffix: true })}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
