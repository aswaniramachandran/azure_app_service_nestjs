import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '../auth/permissions';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardQueryDto } from './dashboard-query.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.DASHBOARD_VIEW)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query);
  }

  @Get('revenue')
  getRevenue(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getRevenue(query);
  }

  @Get('order-status')
  getOrderStatuses() {
    return this.dashboardService.getOrderStatuses();
  }

  @Get('recent-orders')
  getRecentOrders(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getRecentOrders(query);
  }

  @Get('low-stock')
  getLowStock(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getLowStock(query);
  }

  @Get('inventory')
  getInventory(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getInventory(query);
  }
}
