import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from "@nestjs/common";

import { AdminOrdersService } from "./admin-orders.service";

import { SearchOrdersDto } from "../orders/dto/search-orders.dto";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user.entity";
import { UpdateOrderStatusDto } from "../orders/dto/update-order-status.dto";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  findAll(@Query() query: SearchOrdersDto) {
    return this.service.findAllOrders(query);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
