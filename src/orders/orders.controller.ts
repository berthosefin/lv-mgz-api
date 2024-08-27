import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('clientName') clientName?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    return this.ordersService.findAll(
      storeId,
      parsedPage,
      parsedPageSize,
      clientName,
      status,
    );
  }

  @Get('count')
  count(
    @Query('storeId') storeId: string,
    @Query('clientName') clientName?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.count(storeId, clientName, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
