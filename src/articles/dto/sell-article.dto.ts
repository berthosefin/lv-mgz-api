import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class SellArticleDto {
  @ApiProperty({ example: ['article1-id', 'article2-id'], required: true })
  @IsNotEmpty()
  @IsString({ each: true })
  articles: string[];

  @ApiProperty({
    example: [10, 20],
    required: true,
  })
  @IsInt()
  @Min(1)
  sellQuantities: number[];

  @ApiProperty({
    example: 'cash-desk-id',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  cashDeskId: string;
}
