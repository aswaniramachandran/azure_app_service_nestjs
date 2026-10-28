import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CreateAdminDto, UpdatePermissionsDto } from './dto/admin.dto';
import { ALL_PERMISSIONS, ROLE_PRESETS } from '../auth/permissions';
import { AdminsService } from './admin.service';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminsController {
  constructor(private service: AdminsService) {}

  @Get() list() { return this.service.list(); }
  @Get('permissions') permissions() { return ALL_PERMISSIONS; }
  @Get('presets') presets() { return ROLE_PRESETS; }

  @Post() create(@Body() dto: CreateAdminDto) { return this.service.create(dto); }

  @Patch(':id/permissions')
  updatePermissions(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermissionsDto, @Req() req: any) {
    return this.service.updatePermissions(id, dto.permissions, req.user.id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.setActive(id, false, req.user.id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.setActive(id, true, req.user.id);
  }

  @Delete(':id')
  demote(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.demote(id, req.user.id);
  }
}