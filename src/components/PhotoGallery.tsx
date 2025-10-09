'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';

interface StravaPhoto {
  id: number;
  activity_id: number;
  unique_id: string;
  urls: {
    100: string;
    600: string;
  };
  source: number; // 1 = Strava, 2 = Instagram
  caption?: string;
  created_at: string;
}

interface ActivityWithPhotos {
  id: number;
  name: string;
  photos: StravaPhoto[];
}

async function fetchPhotos(): Promise<ActivityWithPhotos[]> {
  const response = await fetch('/api/strava/photos');
  if (!response.ok) {
    throw new Error('Failed to fetch photos');
  }
  const json = await response.json();
  // API returns { success: true, data: [...] }
  return json.data || [];
}

export default function PhotoGallery() {
  const { data: activities, error, isLoading } = useSWR<ActivityWithPhotos[]>(
    '/api/strava/photos',
    fetchPhotos,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const [selectedPhoto, setSelectedPhoto] = useState<StravaPhoto | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Photo Gallery</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // Ensure activities is an array before processing
  if (!activities || !Array.isArray(activities)) {
    return null;
  }

  const allPhotos: { photo: StravaPhoto; activityName: string }[] = [];
  activities.forEach((activity) => {
    if (activity.photos && Array.isArray(activity.photos)) {
      activity.photos.forEach((photo) => {
        allPhotos.push({ photo, activityName: activity.name });
      });
    }
  });

  if (allPhotos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Photo Gallery</h3>
        </div>
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No photos found in your recent activities</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Photo Gallery</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">({allPhotos.length})</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allPhotos.map(({ photo, activityName }) => {
            console.log('[PhotoGallery] Rendering photo:', {
              unique_id: photo.unique_id,
              url600: photo.urls[600],
              url100: photo.urls[100],
              source: photo.source,
              activityName,
            });
            return (
              <div
                key={photo.unique_id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 hover:shadow-lg transition-shadow duration-200"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Image
                  src={photo.urls[600]}
                  alt={activityName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  unoptimized
                />
              {photo.source === 2 && (
                <div className="absolute top-2 right-2 bg-gradient-to-br from-purple-600 to-pink-600 p-1.5 rounded-lg">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedPhoto.urls[600]}
              alt="Activity photo"
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
