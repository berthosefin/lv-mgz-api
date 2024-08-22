import { ApiProperty } from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

class OrderItem {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  articleId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty()
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty()
  @IsBoolean()
  isDelivered: boolean;

  @ApiProperty()
  @IsOptional()
  invoice?: { create?: any; connect?: any };

  @ApiProperty({
    type: [OrderItem],
  })
  @IsNotEmpty()
  @IsArray()
  orderItems: OrderItem[];
}
