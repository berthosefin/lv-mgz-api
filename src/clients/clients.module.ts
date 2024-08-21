import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [ClientsController],
  providers: [ClientsService, TokenBlacklistService],
})
export class ClientsModule {}
