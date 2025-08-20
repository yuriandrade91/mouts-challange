import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @Length(1, 100)
  @ApiProperty({ example: 'Alice', description: 'User full name' })
  name!: string;

  @IsEmail()
  @Length(5, 150)
  @ApiProperty({ example: 'alice@alice.com', description: 'User e-mail (unique)' })
  email!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Me chamo Alice e sou uma programadora full stack!', description: 'Optional user biography' })
  bio?: string;

  @IsString()
  @Length(6, 128)
  @ApiProperty({ example: 'P@ssw0rd', description: 'User password' })
  password!: string;
}
