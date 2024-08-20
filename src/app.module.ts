import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { DatabaseModule } from './database/database.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { TokenBlacklistService } from './token-blacklist/token-blacklist.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    ArticlesModule,
    TransactionsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, TokenBlacklistService],
})
export class AppModule {}
