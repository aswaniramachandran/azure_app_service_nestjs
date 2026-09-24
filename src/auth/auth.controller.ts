import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';


import { JwtAuthGuard } from './jwt-auth.guard';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
login(@Body() loginDto: LoginDto) {
  return this.authService.login(
    loginDto.email,
    loginDto.password,
  );
}

@Post('refresh')
refresh(@Body() refreshTokenDto: RefreshTokenDto) {
  return this.authService.refresh(
    refreshTokenDto.refresh_token,
  );
}

@Post('logout')
logout(@Body() refreshTokenDto: RefreshTokenDto) {
  return this.authService.logout(
    refreshTokenDto.refresh_token,
  );
}

@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@Req() req: any) {
  return req.user;
}
}
