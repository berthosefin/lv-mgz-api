import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;
}
