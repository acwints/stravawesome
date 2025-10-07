'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { StravaActivity } from '@/types';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { METERS_TO_MILES } from '@/constants';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrainingMapProps {
  activities: StravaActivity[];
}

export default function TrainingMap({ activities }: TrainingMapProps) {
  // Filter activities that have location data
  const activitiesWithLocation = activities.filter(
    (activity) => activity.start_latlng && activity.start_latlng.length === 2
  );

  if (activitiesWithLocation.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Locations</h3>
        <p className="text-gray-600">No activities with location data found.</p>
      </div>
    );
  }

  // Calculate bounds to fit all markers
  const bounds = activitiesWithLocation.map((activity) => activity.start_latlng!);
  const mapBounds = L.latLngBounds(bounds);

  // Group activities by type for different colors
  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '#ef4444'; // red
      case 'ride':
      case 'cycling':
        return '#3b82f6'; // blue
      case 'walk':
        return '#10b981'; // green
      case 'hike':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Training Locations</h3>
        <p className="text-sm text-gray-600">
          {activitiesWithLocation.length} activities with location data
        </p>
      </div>
      <div className="h-96 w-full">
        <MapContainer
          bounds={mapBounds}
          boundsOptions={{ padding: [20, 20] }}
          className="h-full w-full rounded-b-lg"
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
      
      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Cycling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Walking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Hiking</span>
          </div>
        </div>
      </div>
    </div>
  );
}