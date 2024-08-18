import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TokenBlacklistService],
})
export class TransactionsModule {}
