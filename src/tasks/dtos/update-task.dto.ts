import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;
}
