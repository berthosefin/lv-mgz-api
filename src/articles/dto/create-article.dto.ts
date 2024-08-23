import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  purchasePrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sellingPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  stock: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  storeId: string;
}
