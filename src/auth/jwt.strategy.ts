// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private readonly configService: ConfigService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

//       secretOrKey:
//         configService.getOrThrow<string>('JWT_SECRET'),
//     });
//   }

//   async validate(payload: any) {
//     return {
//       userId: payload.sub,
//       email: payload.email,
//       role: payload.role,
//     };
//   }
// }






import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    };
  }
}