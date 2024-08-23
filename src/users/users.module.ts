import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, TokenBlacklistService],
  exports: [UsersService],
})
export class UsersModule {}
