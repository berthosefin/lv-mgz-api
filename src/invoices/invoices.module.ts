import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { TransactionsService } from 'src/transactions/transactions.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, TransactionsService],
  exports: [InvoicesService, TransactionsService],
})
export class InvoicesModule {}
