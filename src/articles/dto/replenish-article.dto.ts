import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ReplenishArticleDto {
  @ApiProperty({
    example: 10,
    required: true,
  })
  @IsInt()
  @Min(1)
  replenishQuantity: number;

  @ApiProperty({
    example: 'cash-desk-id',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  cashDeskId: string;
}
