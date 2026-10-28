import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCustomerOrderTracking,
  updateCustomerOrderTrackingLocation,
} from './customerOrderApi.js';
import './customer-order.css';
import './customer-order-tracking.css';

const CustomerOrderTrackingMap = lazy(() => import('./CustomerOrderTrackingMap.jsx'));
const refreshIntervalMs = 15000;

function formatStatus(status) {
  return String(status || 'unknown')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return 'Not updated yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not updated yet' : date.toLocaleString();
}

function formatDistance(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return null;
  return Number(meters) >= 1000
    ? `${(Number(meters) / 1000).toFixed(1)} km`
    : `${Math.round(Number(meters))} m`;
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return null;
  const minutes = Math.max(1, Math.round(Number(seconds) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function isShipped(status) {
  return String(status || '').toLowerCase() === 'shipped';
}

export default function CustomerOrderTrackingPage({ onNavigate }) {
  const orderId = new URLSearchParams(window.location.search).get('order');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [phoneLocation, setPhoneLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [gpsNotice, setGpsNotice] = useState('');
  const watchIdRef = useRef(null);
  const mountedRef = useRef(true);
  const refreshInFlightRef = useRef(false);
  const uploadInFlightRef = useRef(false);
  const queuedLocationsRef = useRef([]);

  const refreshTracking = useCallback(async (isInitial = false) => {
    if (refreshInFlightRef.current || !orderId) return;
    refreshInFlightRef.current = true;
    if (isInitial && mountedRef.current) setLoading(true);
    try {
      const response = await fetchCustomerOrderTracking(orderId);
      if (!response?.order || typeof response.order.status !== 'string') {
        throw new Error('The tracking API returned an invalid response.');
      }
      if (!mountedRef.current) return;
      setTrackingData(response);
      setLastUpdated(response.currentLocation?.updatedAt || null);
      setApiError('');
    } catch (error) {
      if (mountedRef.current) {
        setApiError(error.message || 'Unable to refresh order tracking.');
      }
    } finally {
      refreshInFlightRef.current = false;
      if (isInitial && mountedRef.current) setLoading(false);
    }
  }, [orderId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    queuedLocationsRef.current = [];
    if (mountedRef.current) setTracking(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!orderId) {
      setApiError('A valid order ID is required to view tracking.');
      setLoading(false);
      return () => { mountedRef.current = false; };
    }

    void refreshTracking(true);
    const intervalId = window.setInterval(() => {
      void refreshTracking();
    }, refreshIntervalMs);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [orderId, refreshTracking]);

  useEffect(() => {
    if (tracking && trackingData && !isShipped(trackingData.order.status)) {
      stopTracking();
      setGpsNotice('GPS tracking stopped because this order is no longer shipped.');
    }
  }, [tracking, trackingData, stopTracking]);

  const sendLocation = async (location) => {
    if (uploadInFlightRef.current) {
      queuedLocationsRef.current.push(location);
      return;
    }
    uploadInFlightRef.current = true;
    let nextLocation = location;
    try {
      while (nextLocation && mountedRef.current) {
        const update = nextLocation;
        nextLocation = null;
        try {
          const response = await updateCustomerOrderTrackingLocation(orderId, update);
          if (mountedRef.current) {
            setLastUpdated(response?.location?.updatedAt || new Date().toISOString());
            setApiError('');
          }
        } catch (error) {
          if (mountedRef.current) {
            setApiError(error.message || 'Unable to save the current GPS location.');
          }
        }
        nextLocation = queuedLocationsRef.current.shift() || null;
      }
    } finally {
      uploadInFlightRef.current = false;
    }
  };

  const handleGpsError = (error) => {
    if (!mountedRef.current) return;
    setGpsNotice('');
    const message = error.code === 1
      ? 'Location permission was denied. Allow location access in your browser settings and try again.'
      : error.code === 2
        ? 'Your phone could not determine its location. Move to an area with GPS reception and try again.'
        : error.code === 3
          ? 'Getting your phone location timed out. Please try again.'
          : 'Unable to access your phone location.';
    setGpsError(message);
    if (error.code === 1) stopTracking();
  };

  const startTracking = () => {
    setGpsError('');
    setGpsNotice('');
    if (!trackingData || !isShipped(trackingData.order.status)) {
      setGpsError('GPS tracking is available only while this order is shipped.');
      return;
    }
    if (!window.isSecureContext) {
      setGpsError('Phone GPS access requires a secure HTTPS connection.');
      return;
    }
    if (!navigator.geolocation) {
      setGpsError('GPS is unavailable in this browser or on this device.');
      return;
    }

    try {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!mountedRef.current) return;
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          const phoneFix = {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          };
          setPhoneLocation(phoneFix);
          setGpsError('');
          setGpsNotice('Phone GPS is active; location updates are being sent.');

          const payload = { latitude, longitude, accuracy };
          if (Number.isFinite(speed) && speed >= 0) payload.speedMps = speed;
          if (Number.isFinite(heading) && heading >= 0 && heading <= 360) {
            payload.heading = heading;
          }
          void sendLocation(payload);
        },
        handleGpsError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
      watchIdRef.current = watchId;
      setTracking(true);
      setGpsNotice('Waiting for a GPS fix from this phone…');
    } catch (error) {
      setGpsError(error.message || 'Unable to start GPS tracking.');
    }
  };

  const currentLocation = phoneLocation || trackingData?.currentLocation;
  const destination = trackingData?.destination;
  const canTrack = isShipped(trackingData?.order?.status);
  const routeDistance = formatDistance(trackingData?.route?.distanceInMeters);
  const routeDuration = formatDuration(trackingData?.route?.durationInSeconds);
  const history = Array.isArray(trackingData?.history)
    ? [...trackingData.history].reverse()
    : [];

  return (
    <main className="cot-page">
      <button
        className="co-back cot-back"
        type="button"
        onClick={() => onNavigate(`/customer_order?order=${encodeURIComponent(orderId || '')}`)}
      >
        ← &nbsp; Back to Order Details
      </button>
      <section className="co-hero co-track-hero cot-hero">
        <div>
          <span>LIVE DELIVERY</span>
          <h1>{trackingData?.order?.orderNumber ? `Order #${trackingData.order.orderNumber}` : `Order #${orderId || ''}`}</h1>
          <p>Follow your delivery and check its latest status.</p>
        </div>
      </section>

      {loading && <p className="cot-message" role="status">Loading order tracking…</p>}
      {apiError && <p className="cot-message cot-error" role="alert">{apiError}</p>}
      {!loading && trackingData && (
        <>
          <section className="cot-status-card" aria-label="Order tracking controls">
            <div>
              <span className="cot-eyebrow">ORDER STATUS</span>
              <strong className="cot-status">{formatStatus(trackingData.order.status)}</strong>
              <small>Last location update: {formatDateTime(lastUpdated)}</small>
            </div>
            <div className="cot-actions">
              <button type="button" className="cot-start" onClick={startTracking} disabled={!canTrack || tracking}>
                {tracking ? 'GPS Tracking On' : 'Start GPS Tracking'}
              </button>
              <button type="button" className="cot-stop" onClick={stopTracking} disabled={!tracking}>
                Stop GPS Tracking
              </button>
            </div>
            {!canTrack && <p className="cot-note">GPS updates are available only when the order status is Shipped.</p>}
          </section>

          {gpsError && <p className="cot-message cot-error" role="alert">{gpsError}</p>}
          {gpsNotice && <p className="cot-message" role="status">{gpsNotice}</p>}

          <section className="cot-map-card">
            <div className="cot-map-heading">
              <div><h2>Delivery map</h2><p>{destination?.address || 'Delivery destination'}</p></div>
              <button type="button" onClick={() => void refreshTracking()} disabled={loading}>Refresh</button>
            </div>
            <Suspense fallback={<div className="cot-map-wrap cot-map-loading"><p className="cot-map-message" role="status">Loading map…</p></div>}>
              <CustomerOrderTrackingMap
                currentLocation={currentLocation}
                destination={destination}
                route={trackingData.route}
              />
            </Suspense>
            <div className="cot-map-legend">
              <span><i className="cot-legend-you" />Your phone / latest driver location</span>
              <span><i className="cot-legend-destination" />Delivery destination</span>
              {!trackingData.route?.geometry && <small>Driving route is not available yet.</small>}
            </div>
            {(routeDistance || routeDuration) && (
              <p className="cot-route-summary">
                {routeDistance && <span>Route: <b>{routeDistance}</b></span>}
                {routeDuration && <span>Estimated drive: <b>{routeDuration}</b></span>}
              </p>
            )}
            {currentLocation && (
              <p className="cot-coordinates">
                Location: {Number(currentLocation.latitude).toFixed(5)}, {Number(currentLocation.longitude).toFixed(5)}
                {currentLocation.accuracy != null && Number.isFinite(Number(currentLocation.accuracy)) && ` · ±${Math.round(Number(currentLocation.accuracy))} m`}
              </p>
            )}
            {!currentLocation && <p className="cot-map-empty">No GPS location has been reported yet.</p>}
          </section>

          <section className="cot-history-card">
            <h2>Tracking history</h2>
            {history.length ? (
              <ol>
                {history.map((event, index) => (
                  <li key={event.id || `${event.createdAt}-${index}`}>
                    <span className="cot-history-dot" />
                    <div><strong>{formatStatus(event.status)}</strong><p>{event.message || 'Order status updated.'}</p><small>{formatDateTime(event.createdAt)}</small></div>
                  </li>
                ))}
              </ol>
            ) : <p>No tracking events are available yet.</p>}
          </section>
        </>
      )}
    </main>
  );
}
