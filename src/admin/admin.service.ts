import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { CreateAdminDto } from './dto/admin.dto';
import { Permission, ROLE_PRESETS } from '../auth/permissions';

@Injectable()
export class AdminsService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  private clean(u: User) {
    return {
      id: u.id, name: u.name, email: u.email,
      role: u.role, permissions: u.permissions ?? [], is_active: u.is_active,
    };
  }

  private async getEditableAdmin(id: number, actorId: number) {
    if (id === actorId) throw new BadRequestException('You cannot change your own account here');
    const admin = await this.repo.findOne({ where: { id } });
    if (!admin || admin.role !== UserRole.ADMIN) throw new NotFoundException('Admin not found');
    return admin;
  }

  async list() {
    const admins = await this.repo.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
    });
    return admins.map((a) => this.clean(a));
  }

  async create(dto: CreateAdminDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.repo.findOne({ where: { email } })) {
      throw new ConflictException('Email already registered');
    }
    const admin = this.repo.create({
      name: dto.name.trim(),
      email,
      password_hash: await bcrypt.hash(dto.password, 10),
      role: UserRole.ADMIN,
      permissions: dto.preset ? ROLE_PRESETS[dto.preset] : (dto.permissions ?? []),
      is_active: true,
    });
    return this.clean(await this.repo.save(admin));
  }

  async updatePermissions(id: number, permissions: Permission[], actorId: number) {
    const admin = await this.getEditableAdmin(id, actorId);
    admin.permissions = permissions;
    return this.clean(await this.repo.save(admin));
  }

  async setActive(id: number, active: boolean, actorId: number) {
    const admin = await this.getEditableAdmin(id, actorId);
    admin.is_active = active;
    return this.clean(await this.repo.save(admin));
  }

  async demote(id: number, actorId: number) {
    const admin = await this.getEditableAdmin(id, actorId);
    admin.role = UserRole.USER;
    admin.permissions = null;
    return this.clean(await this.repo.save(admin));
  }
}