// import { useEffect, useRef } from 'react';
// import * as atlas from 'azure-maps-control';
// import 'azure-maps-control/dist/atlas.min.css';

// type Point = {
//   latitude: number | null;
//   longitude: number | null;
// };

// type Props = {
//   currentLocation: Point | null;
//   destination: Point | null;
//   routeGeometry?: GeoJSON.Geometry | null;
// };

// export default function AzureOrderMap({
//   currentLocation,
//   destination,
//   routeGeometry,
// }: Props) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<atlas.Map | null>(null);
//   const sourceRef = useRef<atlas.source.DataSource | null>(null);

//   const driverRef = useRef<atlas.HtmlMarker | null>(null);
//   const destinationRef = useRef<atlas.HtmlMarker | null>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const key = import.meta.env.VITE_AZURE_MAPS_BROWSER_KEY;

//     if (!key) {
//       console.error('Missing VITE_AZURE_MAPS_BROWSER_KEY');
//       return;
//     }

//     const map = new atlas.Map(containerRef.current, {
//       center: [0, 0],
//       zoom: 2,
//       authOptions: {
//         authType: 'subscriptionKey',
//         subscriptionKey: key,
//       },
//     });

//     mapRef.current = map;

//     map.events.add('ready', () => {
//       const source = new atlas.source.DataSource();
//       map.sources.add(source);
//       sourceRef.current = source;

//       map.layers.add(
//         new atlas.layer.LineLayer(source, 'route-line', {
//           strokeColor: '#2563eb',
//           strokeWidth: 5,
//         }),
//       );

//       map.layers.add(
//         new atlas.layer.BubbleLayer(source, 'route-points', {
//           radius: 6,
//           color: '#2563eb',
//         }),
//       );
//     });

//     return () => {
//       map.dispose();
//       mapRef.current = null;
//       sourceRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const updateMap = () => {
//       if (!mapRef.current || !sourceRef.current) return;

//       const source = sourceRef.current;
//       const features: atlas.data.Feature<atlas.data.Geometry>[] = [];

//       const validCurrent =
//         currentLocation?.latitude != null &&
//         currentLocation?.longitude != null;

//       const validDestination =
//         destination?.latitude != null &&
//         destination?.longitude != null;

//       if (validCurrent) {
//         const position: [number, number] = [
//           currentLocation.longitude!,
//           currentLocation.latitude!,
//         ];

//         features.push(
//           new atlas.data.Feature(
//             new atlas.data.Point(position),
//             { type: 'driver' },
//           ),
//         );

//         if (!driverRef.current) {
//           driverRef.current = new atlas.HtmlMarker({
//             position,
//             text: 'D',
//             color: '#2563eb',
//           });
//           map.markers.add(driverRef.current);
//         } else {
//           driverRef.current.setOptions({ position });
//         }
//       }

//       if (validDestination) {
//         const position: [number, number] = [
//           destination.longitude!,
//           destination.latitude!,
//         ];

//         features.push(
//           new atlas.data.Feature(
//             new atlas.data.Point(position),
//             { type: 'destination' },
//           ),
//         );

//         if (!destinationRef.current) {
//           destinationRef.current = new atlas.HtmlMarker({
//             position,
//             text: 'H',
//             color: '#dc2626',
//           });
//           map.markers.add(destinationRef.current);
//         } else {
//           destinationRef.current.setOptions({ position });
//         }
//       }

//       if (routeGeometry) {
//         features.push(
//           new atlas.data.Feature(routeGeometry, { type: 'route' }),
//         );
//       }

//       source.clear();
//       source.add(features);

//       if (validCurrent && validDestination) {
//         const bounds = atlas.data.BoundingBox.fromPositions([
//           [
//             currentLocation.longitude!,
//             currentLocation.latitude!,
//           ],
//           [
//             destination.longitude!,
//             destination.latitude!,
//           ],
//         ]);

//         map.setCamera({
//           bounds,
//           padding: 60,
//           maxZoom: 16,
//         });
//       } else if (validCurrent) {
//         map.setCamera({
//           center: [
//             currentLocation.longitude!,
//             currentLocation.latitude!,
//           ],
//           zoom: 15,
//         });
//       } else if (validDestination) {
//         map.setCamera({
//           center: [
//             destination.longitude!,
//             destination.latitude!,
//           ],
//           zoom: 14,
//         });
//       }
//     };

//     if (mapRef.current.isStyleLoaded()) {
//       updateMap();
//     } else {
//       map.events.addOnce('ready', updateMap);
//     }
//   }, [currentLocation, destination, routeGeometry]);

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width: '100%',
//         height: '450px',
//         borderRadius: '12px',
//         overflow: 'hidden',
//       }}
//     />
//   );
// }