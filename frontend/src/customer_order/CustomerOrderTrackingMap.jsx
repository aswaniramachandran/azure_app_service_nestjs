import { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

function validPoint(point) {
  return point?.latitude != null &&
    point?.longitude != null &&
    Number.isFinite(Number(point.latitude)) &&
    Number.isFinite(Number(point.longitude));
}

export default function CustomerOrderTrackingMap({
  currentLocation,
  destination,
  route,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const sourceRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    const key = import.meta.env.VITE_AZURE_MAPS_BROWSER_KEY;
    if (!key) {
      setMapError('The map is unavailable because Azure Maps is not configured.');
      return undefined;
    }

    if (!containerRef.current) return undefined;

    const map = new atlas.Map(containerRef.current, {
      center: [0, 0],
      zoom: 2,
      authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: key,
      },
    });
    mapRef.current = map;

    map.events.addOnce('ready', () => {
      if (mapRef.current !== map) return;
      const source = new atlas.source.DataSource();
      map.sources.add(source);
      map.layers.add(new atlas.layer.LineLayer(source, 'delivery-route', {
        strokeColor: '#604bff',
        strokeWidth: 5,
      }));
      sourceRef.current = source;
      setMapReady(true);
    });

    return () => {
      map.dispose();
      mapRef.current = null;
      sourceRef.current = null;
      currentMarkerRef.current = null;
      destinationMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = sourceRef.current;
    if (!mapReady || !map || !source) return;

    const updateMarker = (point, markerRef, text, color) => {
      if (!validPoint(point)) {
        if (markerRef.current) map.markers.remove(markerRef.current);
        markerRef.current = null;
        return;
      }

      const position = [Number(point.longitude), Number(point.latitude)];
      if (!markerRef.current) {
        markerRef.current = new atlas.HtmlMarker({
          position,
          text,
          color,
          title: text === 'You' ? 'Your phone GPS location' : 'Delivery destination',
        });
        map.markers.add(markerRef.current);
      } else {
        markerRef.current.setOptions({ position });
      }
    };

    updateMarker(currentLocation, currentMarkerRef, 'You', '#604bff');
    updateMarker(destination, destinationMarkerRef, 'D', '#e25563');

    source.clear();
    if (route?.geometry) {
      source.add(new atlas.data.Feature(route.geometry));
    }

    const cameraPoints = [currentLocation, destination]
      .filter(validPoint)
      .map((point) => [Number(point.longitude), Number(point.latitude)]);
    if (cameraPoints.length > 1) {
      map.setCamera({
        bounds: atlas.data.BoundingBox.fromPositions(cameraPoints),
        padding: 56,
        maxZoom: 15,
      });
    } else if (cameraPoints.length === 1) {
      map.setCamera({ center: cameraPoints[0], zoom: 14 });
    }
  }, [currentLocation, destination, route, mapReady]);

  return (
    <div className="cot-map-wrap">
      {mapError ? (
        <p className="cot-map-message" role="status">{mapError}</p>
      ) : (
        <>
          <div className="cot-map" ref={containerRef} aria-label="Live order delivery map" />
          {!mapReady && <p className="cot-map-message" role="status">Loading map…</p>}
        </>
      )}
    </div>
  );
}
