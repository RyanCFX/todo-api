import { IsOptional, IsString } from 'class-validator';

export class AddTaskDto {
  @IsString()
  groupId: string;
  
  @IsString()
  title: string;
  
  @IsString()
  @IsOptional()
  description: string;
}

export class ChangeTaskStatusDto {
  @IsString()
  taskId: string;
  
  @IsString()
  statusCode: string;
}
