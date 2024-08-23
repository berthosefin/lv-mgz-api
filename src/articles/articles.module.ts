import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { AuthModule } from 'src/auth/auth.module';
import { StoreModule } from 'src/store/store.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [AuthModule, StoreModule, TransactionsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
