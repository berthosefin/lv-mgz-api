import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty()
  @IsBoolean()
  isPaid: boolean;
}
