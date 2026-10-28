import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Order, OrderStatus } from "../orders/order.entity";
import { OrderLiveLocation } from "./order-live-location.entity";
import { OrderTracking } from "./order-tracking.entity";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { AzureMapsService } from "./azure-maps.service";

type DestinationCoordinates = {
  latitude: number;
  longitude: number;
};

type DrivingRoute = {
  geometry: any;
  distanceInMeters: number | null;
  durationInSeconds: number | null;
};

@Injectable()
export class OrderTrackingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderLiveLocation)
    private readonly locationRepo: Repository<OrderLiveLocation>,

    @InjectRepository(OrderTracking)
    private readonly historyRepo: Repository<OrderTracking>,

    private readonly azureMaps: AzureMapsService,
  ) {}

  // Find an order by ID.
  private async getOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  // Build the delivery address from the saved order.
  private getDestination(order: Order): string {
    const address = [
      (order as any).addressLine1,
      (order as any).addressLine2,
      (order as any).city,
      (order as any).state,
      (order as any).pincode,
      (order as any).country,
    ]
      .filter(Boolean)
      .join(", ");

    if (!address) {
      throw new BadRequestException(
        "The order does not have a delivery address",
      );
    }

    return address;
  }

  // Save an order status change in tracking history.
  async recordEvent(orderId: number, status: OrderStatus, message?: string) {
    const event = this.historyRepo.create({
      orderId,
      status,
      message: message ?? `Order status changed to ${status}`,
      latitude: null,
      longitude: null,
    });

    return this.historyRepo.save(event);
  }

  // Receive GPS coordinates from the driver's phone.
  async updateDriverLocation(orderId: number, dto: UpdateLocationDto) {
    const order = await this.getOrder(orderId);

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        "GPS tracking can only be updated after the order is shipped",
      );
    }

    let location = await this.locationRepo.findOne({
      where: { orderId },
    });

    if (!location) {
      location = this.locationRepo.create({ orderId });
    }

    location.latitude = dto.latitude;
    location.longitude = dto.longitude;
    location.accuracy = dto.accuracy ?? null;
    location.speedMps = dto.speedMps ?? null;
    location.heading = dto.heading ?? null;

    const savedLocation = await this.locationRepo.save(location);

    return {
      message: "Driver location updated",
      location: savedLocation,
    };
  }

  // Customer can track only their own order.
  async getCustomerTracking(orderId: number, userId: number) {
    const order = await this.getOrder(orderId);

    if (Number(order.userId) !== Number(userId)) {
      throw new ForbiddenException(
        "You cannot view another customer’s tracking information",
      );
    }

    return this.buildTrackingResponse(order);
  }

  // Admin can view any order's tracking.
  async getAdminTracking(orderId: number) {
    const order = await this.getOrder(orderId);

    return this.buildTrackingResponse(order);
  }

  // Convert the delivery address into map coordinates.
  private async geocodeDestination(
    address: string,
  ): Promise<DestinationCoordinates | null> {
    return this.azureMaps.geocodeAddress(address);
  }

  // Return the order, latest GPS location, destination, route and history.
  private async buildTrackingResponse(order: Order) {
    const [location, history] = await Promise.all([
      this.locationRepo.findOne({
        where: { orderId: order.id },
      }),

      this.historyRepo.find({
        where: { orderId: order.id },
        order: { createdAt: "ASC" },
      }),
    ]);

    let destinationAddress: string | null = null;

    let destination: DestinationCoordinates | null = null;

    let route: DrivingRoute | null = null;

    try {
      destinationAddress = this.getDestination(order);

      destination = await this.geocodeDestination(destinationAddress);

      if (location && destination) {
        route = await this.azureMaps.getDrivingRoute(
          location.latitude,
          location.longitude,
          destination.latitude,
          destination.longitude,
        );
      }
    } catch (error) {
      // Tracking data is still returned if geocoding or routing fails.
      console.error("Azure Maps tracking error:", error);
    }

    return {
      order: {
        id: order.id,
        orderNumber: (order as any).orderNumber,
        status: order.status,
      },

      currentLocation: location,

      destination: {
        address: destinationAddress,
        latitude: destination?.latitude ?? null,
        longitude: destination?.longitude ?? null,
      },

      route,

      history,
    };
  }

  async updateCustomerTestLocation(
    orderId: number,
    userId: number,
    dto: UpdateLocationDto,
  ) {
    const order = await this.getOrder(orderId);

    // The test device can update only its owner's order.
    if (Number(order.userId) !== Number(userId)) {
      throw new ForbiddenException(
        "You can only update tracking for your own order",
      );
    }

    return this.updateDriverLocation(orderId, dto);
  }
}
