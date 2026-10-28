import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import { User, UserRole } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.usersRepository.findOne({
      where: { id },
    });
  }


  
  async create(name: string, email: string, password_hash: string) {
    const user = this.usersRepository.create({
      name,
      email,
      password_hash,
      role: UserRole.USER,
    });
    return this.usersRepository.save(user);
  }
}
