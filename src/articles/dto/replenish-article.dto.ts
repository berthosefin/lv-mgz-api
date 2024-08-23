import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ReplenishArticleDto {
  @ApiProperty({
    example: 10,
    required: true,
  })
  @IsInt()
  @Min(1)
  replenishQuantity: number;
}
