import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';


import { UserRole } from '../users/user.entity';

import { OrderTrackingService } from './order-tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminOrderTrackingController {
  constructor(
    private readonly trackingService: OrderTrackingService,
  ) {}

  @Get(':id/tracking')
  getTracking(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.trackingService.getAdminTracking(id);
  }

  @Post(':id/tracking/location')
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.trackingService.updateDriverLocation(id, dto);
  }
}