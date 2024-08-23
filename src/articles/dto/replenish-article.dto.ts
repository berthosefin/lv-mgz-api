import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ReplenishArticleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  replenishQuantity: number;
}
