import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min, IsInt } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    example: 'article1-id',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: 'Article 1',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 5_000,
    required: true,
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({
    example: 5_500,
    required: true,
  })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({
    example: 10,
    required: true,
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    example: 'pièce',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({
    example: 'store-id',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  storeId: string;
}
