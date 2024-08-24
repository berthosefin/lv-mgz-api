import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ClientsModule } from 'src/clients/clients.module';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, ClientsModule, InvoicesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
