
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrderTrackingService } from './order-tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderTrackingController {
  constructor(
    private readonly trackingService: OrderTrackingService,
  ) {}

  // Customer retrieves their own order tracking
  @Get(':id/tracking')
  getTracking(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.trackingService.getCustomerTracking(
      id,
      req.user.id,
    );
  }

  // Development/testing: use the customer's own phone as GPS device
  @Patch(':id/tracking/location')
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.trackingService.updateCustomerTestLocation(
      id,
      req.user.id,
      dto,
    );
  }
}
