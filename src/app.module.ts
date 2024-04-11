import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { DatabaseModule } from './database/database.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [DatabaseModule, ArticlesModule, TransactionsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
