import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureMapsService {
  private readonly key: string;
  private readonly baseUrl = 'https://atlas.microsoft.com';

  constructor(private readonly config: ConfigService) {
    this.key =
      this.config.get<string>('AZURE_MAPS_SUBSCRIPTION_KEY') ?? '';

    if (!this.key) {
      throw new Error(
        'AZURE_MAPS_SUBSCRIPTION_KEY is missing from environment variables',
      );
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    const url = new URL(`${this.baseUrl}/reverseGeocode`);

    url.searchParams.set('api-version', '2026-01-01');
    url.searchParams.set(
      'coordinates',
      `${longitude},${latitude}`,
    );
    url.searchParams.set('subscription-key', this.key);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Azure Maps returned ${response.status}`);
      }

      const data = await response.json();

      return (
        data?.features?.[0]?.properties?.address?.freeformAddress ??
        data?.features?.[0]?.properties?.address?.formattedAddress ??
        null
      );
    } catch {
      throw new InternalServerErrorException(
        'Unable to get the location address from Azure Maps',
      );
    }
  }

  async getDrivingRoute(
    originLatitude: number,
    originLongitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
  ) {
    const url = new URL(`${this.baseUrl}/route/directions`);

    url.searchParams.set('api-version', '2025-01-01');
    url.searchParams.set('subscription-key', this.key);

    const body = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [originLongitude, originLatitude],
          },
          properties: {
            pointIndex: 0,
            pointType: 'waypoint',
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              destinationLongitude,
              destinationLatitude,
            ],
          },
          properties: {
            pointIndex: 1,
            pointType: 'waypoint',
          },
        },
      ],
      travelMode: 'driving',
      routeOutputOptions: ['routePath'],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/geo+json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Azure Maps returned ${response.status}`);
      }

      const data = await response.json();
      const feature = data?.features?.[0];

      if (!feature) {
        throw new Error('Azure Maps returned no route');
      }

      const summary = feature.properties?.summary ?? {};

      return {
        geometry: feature.geometry,
        distanceInMeters: summary.lengthInMeters ?? null,
        durationInSeconds: summary.travelTimeInSeconds ?? null,
      };
    } catch {
      throw new InternalServerErrorException(
        'Unable to calculate the driving route',
      );
    }
  }
  async geocodeAddress(
  address: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const url = new URL(`${this.baseUrl}/geocode`);

  url.searchParams.set('api-version', '2026-01-01');
  url.searchParams.set('query', address);
  url.searchParams.set('subscription-key', this.key);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Azure Maps returned ${response.status}`);
    }

    const data = await response.json();
    const coordinates = data?.features?.[0]?.geometry?.coordinates;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      return null;
    }

    return {
      longitude: coordinates[0],
      latitude: coordinates[1],
    };
  } catch {
    throw new Error('Azure Maps address geocoding failed');
  }
}
}