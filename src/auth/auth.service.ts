import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { JwtService } from "@nestjs/jwt";
import { RefreshToken } from "./refresh-token.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createHash, randomBytes } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // 1. Check if email already exists
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Save user
    const user = await this.usersService.create(name, email, password_hash);

    // 4. Never return password/hash
    return {
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }async login(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);

  if (!user) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedException(
      'Invalid email or password',
    );
  }

  // 1. Create access token
  const payload = {
    sub: user.id,
    email: user.email,
  };

  const access_token = this.jwtService.sign(payload);

  // 2. Create random refresh token
  const refresh_token = randomBytes(64).toString('hex');

  // 3. Hash refresh token
  const token_hash = createHash('sha256')
    .update(refresh_token)
    .digest('hex');

  // 4. Refresh token expires in 7 days
  const expires_at = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  // 5. Save refresh token hash in database
  const refreshToken =
    this.refreshTokenRepository.create({
      token_hash,
      expires_at,
      user,
    });

  await this.refreshTokenRepository.save(refreshToken);

  return {
    message: 'Login successful',

    access_token,

    refresh_token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

async refresh(refresh_token: string) {
  const token_hash = createHash('sha256')
    .update(refresh_token)
    .digest('hex');

  const storedToken =
    await this.refreshTokenRepository.findOne({
      where: {
        token_hash,
      },
      relations: {
        user: true,
      },
    });

  if (!storedToken) {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
  }

  if (storedToken.revoked) {
    throw new UnauthorizedException(
      'Refresh token has been revoked',
    );
  }

  if (storedToken.expires_at < new Date()) {
    throw new UnauthorizedException(
      'Refresh token has expired',
    );
  }

  const payload = {
    sub: storedToken.user.id,
    email: storedToken.user.email,
  };

  const access_token =
    this.jwtService.sign(payload);

  return {
    access_token,
  };
}

async logout(refresh_token: string) {
  const token_hash = createHash('sha256')
    .update(refresh_token)
    .digest('hex');

  const storedToken =
    await this.refreshTokenRepository.findOne({
      where: {
        token_hash,
      },
    });

  if (!storedToken) {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
  }

  storedToken.revoked = true;

  await this.refreshTokenRepository.save(
    storedToken,
  );

  return {
    message: 'Logout successful',
  };
}
}
