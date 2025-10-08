'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { StravaActivity } from '@/types';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { METERS_TO_MILES } from '@/constants';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

  if (activitiesWithLocation.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Training Locations</h3>
        <p className="text-gray-600 dark:text-gray-400">No activities with location data found.</p>
      </div>
    );
  }

  // Calculate bounds to fit all markers
  const bounds = activitiesWithLocation.map((activity) => activity.start_latlng!);
  const mapBounds = L.latLngBounds(bounds);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Training Locations</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {activitiesWithLocation.length} activities with location data
        </p>
      </div>
      <div className="h-96 w-full">
        <MapContainer
          bounds={mapBounds}
          boundsOptions={{ padding: [20, 20] }}
          className="h-full w-full"
          zoom={10}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {activitiesWithLocation.map((activity) => (
            <Marker
              key={activity.id}
              position={[activity.start_latlng![0], activity.start_latlng![1]]}
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
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
