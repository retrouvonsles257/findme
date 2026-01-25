/**
 * =====================================================
 * RETROUVONSLES - useProximityAlerts Hook
 * Hook for managing proximity zones and alerts
 * =====================================================
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import { fetchProximityZones, fetchAlerts, dismissAlert } from '../store/geolocalisationSlice';
import {
  selectProximityZones,
  selectProximityAlerts,
  selectActiveAlerts,
  selectGeolocationLoading,
  selectGeolocationError,
} from '../store/geolocalisationSelectors';
import type {
  CurrentLocation,
  ProximityAlert,
  ProximityZone,
  UseProximityAlertsReturn,
} from '../types';
import * as geolocationService from '../services/index';
import { createProximityZone, createAlert } from '../services/geolocationAPI';

export const useProximityAlerts = (): UseProximityAlertsReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const proximityAlerts = useSelector(selectProximityAlerts);
  const proximityZones = useSelector(selectProximityZones);
  const activeAlerts = useSelector(selectActiveAlerts);
  const isLoading = useSelector(selectGeolocationLoading);
  const error = useSelector(selectGeolocationError);

  const addProximityZone = useCallback(
    async (zone: ProximityZone) => {
      await createProximityZone({
        latitude_centre: zone.latitude_centre,
        longitude_centre: zone.longitude_centre,
        rayon_km: zone.rayon_km,
        nom: zone.nom,
        description: zone.description,
      });
      await dispatch(fetchProximityZones());
    },
    [dispatch],
  );

  const createAlertFunc = useCallback(
    async (zone: ProximityZone): Promise<ProximityAlert> => {
      const alert = await createAlert({
        titre: zone.nom,
        message: `Alert for zone: ${zone.nom}`,
        type_alerte: 'disparition_enfant',
      });
      await dispatch(fetchAlerts());
      return alert;
    },
    [dispatch],
  );

  const checkProximity = useCallback(
    (location: CurrentLocation): string[] => {
      const triggeredAlerts: string[] = [];

      proximityZones.forEach((zone: ProximityZone) => {
        const distance = geolocationService.calculateDistance(
          location.latitude,
          location.longitude,
          zone.latitude_centre,
          zone.longitude_centre,
        );

        if (distance <= zone.rayon_km && !activeAlerts.includes(zone.id)) {
          triggeredAlerts.push(zone.id);
        }
      });

      return triggeredAlerts;
    },
    [proximityZones, activeAlerts],
  );

  const dismissAlertCallback = useCallback(
    (alertId: string) => {
      dispatch(dismissAlert(alertId));
    },
    [dispatch],
  );

  // Load zones and alerts on mount
  useEffect(() => {
    dispatch(fetchProximityZones());
    dispatch(fetchAlerts());
  }, [dispatch]);

  return {
    proximityAlerts,
    activeAlerts,
    isLoading,
    error,
    addProximityZone,
    createAlert: createAlertFunc,
    checkProximity,
    dismissAlert: dismissAlertCallback,
  };
};
