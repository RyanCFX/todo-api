import { IsOptional, IsString } from 'class-validator';

export class AddGroupDto {
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  name: string;
}

export class AddUserGroupDto {
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  groupCode: string;
}
