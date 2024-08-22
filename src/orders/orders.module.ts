import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ClientsModule } from 'src/clients/clients.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, ClientsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
