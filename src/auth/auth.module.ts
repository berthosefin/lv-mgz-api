import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, TokenBlacklistService],
  exports: [JwtModule, TokenBlacklistService],
})
export class AuthModule {}
