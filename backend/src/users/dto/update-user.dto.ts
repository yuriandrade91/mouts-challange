import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@Length(1, 100)
	@ApiPropertyOptional({ example: 'Alice' })
	name?: string;

	@IsOptional()
	@IsEmail()
	@Length(5, 150)
		@ApiPropertyOptional({ example: 'alice@example.com' })
		email?: string;

	@IsOptional()
	@IsString()
		@ApiPropertyOptional({ example: 'Bio text' })
		bio?: string;
}
