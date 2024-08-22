import { ApiProperty } from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  articleId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({})
  @IsNotEmpty()
  @IsUUID()
  storeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @ApiProperty()
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty()
  @IsBoolean()
  isDelivered: boolean;

  @ApiProperty({
    type: [OrderItemDto],
  })
  @IsArray()
  orderItems: OrderItemDto[];
}
