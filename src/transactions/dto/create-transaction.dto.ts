import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'OUT', required: true })
  @IsString()
  type: string;

  @ApiProperty({ example: 100_000, required: true })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'STOCK IN', required: true })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: ['article1-id', 'article2-id'] })
  @IsOptional()
  @IsString({ each: true })
  articles?: string[];

  @ApiProperty({ example: 'cash-desk-id', required: true })
  @IsString()
  @IsNotEmpty()
  cashDeskId: string;
}
