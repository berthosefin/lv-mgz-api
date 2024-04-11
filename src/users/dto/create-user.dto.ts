import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'userid',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: 'user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Min(3)
  username: string;

  @ApiProperty({
    example: 'Pass1234',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Min(6)
  password: string;

  @ApiProperty({
    example: 'Store',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  storeName: string;
}
