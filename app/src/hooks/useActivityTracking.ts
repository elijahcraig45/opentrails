import * as Location from 'expo-location';
import type { LocationObject, PermissionStatus } from 'expo-location';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface ActivitySession {
  id: string;
  startTime: number;
  endTime?: number;
  points: GPSPoint[];
  totalDistance: number; // in meters
  totalElevationGain: number; // in meters (estimated)
  avgSpeed: number; // in m/s
  maxSpeed: number; // in m/s
  duration: number; // in seconds
  isRecording: boolean;
}

interface UseActivityTrackingOptions {
  minAccuracy?: number; // meters, default 50
  updateInterval?: number; // milliseconds, default 5000 (5 seconds)
  onLocationUpdate?: (point: GPSPoint) => void;
  onError?: (error: Error) => void;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimate elevation gain from GPS altitude readings
 * This is imperfect but better than nothing without a DEM
 */
function estimateElevationGain(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  let totalGain = 0;
  for (let i = 1; i < points.length; i++) {
    const prevAltitude = points[i - 1].altitude || 0;
    const currAltitude = points[i].altitude || 0;
    const diff = currAltitude - prevAltitude;

    // Only count uphill movement, with minimum threshold to avoid noise
    if (diff > 2) {
      totalGain += diff;
    }
  }

  return totalGain;
}

/**
 * Hook for tracking GPS activity (hiking, running, etc.)
 */
export function useActivityTracking(options: UseActivityTrackingOptions = {}) {
  const {
    minAccuracy = 50,
    updateInterval = 5000,
    onLocationUpdate,
    onError,
  } = options;

  const [session, setSession] = useState<ActivitySession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<ActivitySession | null>(null);
  const lastLocationRef = useRef<GPSPoint | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(foreground.status);

      if (foreground.status !== 'granted') {
        const error = new Error('Location permission denied');
        setError(error.message);
        onError?.(error);
        return false;
      }

      return true;
    } catch (err: any) {
      const error = new Error(`Permission request failed: ${err.message}`);
      setError(error.message);
      onError?.(error);
      return false;
    }
  }, [onError]);

  // Start tracking
  const startTracking = useCallback(async () => {
    try {
      setError(null);

      // Request permissions if not already granted
      const hasPermission = permissionStatus === 'granted' || (await requestPermissions());
      if (!hasPermission) {
        return;
      }

      // Create new session
      const newSession: ActivitySession = {
        id: Date.now().toString(),
        startTime: Date.now(),
        points: [],
        totalDistance: 0,
        totalElevationGain: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        duration: 0,
        isRecording: true,
      };

      sessionRef.current = newSession;
      setSession(newSession);
      setIsRecording(true);

      // Watch location
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: updateInterval,
          distanceInterval: 0, // Update on every time interval
        },
        (location: LocationObject) => {
          const point: GPSPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude ?? undefined,
            accuracy: location.coords.accuracy ?? undefined,
            timestamp: location.timestamp,
          };

          // Filter by accuracy
          if (point.accuracy && point.accuracy > minAccuracy) {
            console.log(`Skipping low-accuracy reading: ${point.accuracy}m`);
            return;
          }

          if (!sessionRef.current) return;

          // Add to session
          sessionRef.current.points.push(point);

          // Calculate distance and elevation
          if (lastLocationRef.current) {
            const distance = haversineDistance(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              point.latitude,
              point.longitude
            );
            sessionRef.current.totalDistance += distance;

            const timeDiff = (point.timestamp - lastLocationRef.current.timestamp) / 1000; // seconds
            const speed = distance / timeDiff; // m/s

            if (speed > sessionRef.current.maxSpeed) {
              sessionRef.current.maxSpeed = speed;
            }
          }

          // Recalculate stats
          sessionRef.current.duration = (Date.now() - sessionRef.current.startTime) / 1000;
          sessionRef.current.totalElevationGain = estimateElevationGain(sessionRef.current.points);
          sessionRef.current.avgSpeed =
            sessionRef.current.totalDistance / Math.max(sessionRef.current.duration, 1);

          lastLocationRef.current = point;
          onLocationUpdate?.(point);
          setSession({ ...sessionRef.current });
        }
      );
    } catch (err: any) {
      const error = new Error(`Failed to start tracking: ${err.message}`);
      setError(error.message);
      onError?.(error);
      setIsRecording(false);
    }
  }, [permissionStatus, requestPermissions, updateInterval, minAccuracy, onLocationUpdate, onError]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      if (sessionRef.current) {
        sessionRef.current.endTime = Date.now();
        sessionRef.current.isRecording = false;
        setSession({ ...sessionRef.current });
      }

      setIsRecording(false);
      lastLocationRef.current = null;
    } catch (err: any) {
      const error = new Error(`Failed to stop tracking: ${err.message}`);
      setError(error.message);
      onError?.(error);
    }
  }, [onError]);

  // Pause tracking (stop updates but keep session)
  const pauseTracking = useCallback(async () => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setIsRecording(false);
    } catch (err: any) {
      const error = new Error(`Failed to pause tracking: ${err.message}`);
      setError(error.message);
      onError?.(error);
    }
  }, [onError]);

  // Resume tracking
  const resumeTracking = useCallback(async () => {
    if (!sessionRef.current) {
      const error = new Error('No active session to resume');
      setError(error.message);
      onError?.(error);
      return;
    }

    try {
      setError(null);
      setIsRecording(true);

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: updateInterval,
          distanceInterval: 0,
        },
        (location: LocationObject) => {
          // Same logic as startTracking
          const point: GPSPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude ?? undefined,
            accuracy: location.coords.accuracy ?? undefined,
            timestamp: location.timestamp,
          };

          if (point.accuracy && point.accuracy > minAccuracy) return;
          if (!sessionRef.current) return;

          sessionRef.current.points.push(point);

          if (lastLocationRef.current) {
            const distance = haversineDistance(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              point.latitude,
              point.longitude
            );
            sessionRef.current.totalDistance += distance;

            const timeDiff = (point.timestamp - lastLocationRef.current.timestamp) / 1000;
            const speed = distance / timeDiff;
            if (speed > sessionRef.current.maxSpeed) {
              sessionRef.current.maxSpeed = speed;
            }
          }

          sessionRef.current.duration = (Date.now() - sessionRef.current.startTime) / 1000;
          sessionRef.current.totalElevationGain = estimateElevationGain(sessionRef.current.points);
          sessionRef.current.avgSpeed =
            sessionRef.current.totalDistance / Math.max(sessionRef.current.duration, 1);

          lastLocationRef.current = point;
          onLocationUpdate?.(point);
          setSession({ ...sessionRef.current });
        }
      );
    } catch (err: any) {
      const error = new Error(`Failed to resume tracking: ${err.message}`);
      setError(error.message);
      onError?.(error);
      setIsRecording(false);
    }
  }, [updateInterval, minAccuracy, onLocationUpdate, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    session,
    isRecording,
    permissionStatus,
    error,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    requestPermissions,
  };
}
