import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty()
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty()
  @IsBoolean()
  isDelivered: boolean;
}
