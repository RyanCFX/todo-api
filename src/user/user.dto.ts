import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class AddUserDto {
  @IsString({ message: 'El nombre es requerido.' })
  name: string;

  @IsString({ message: 'El apellido es requerido.' })
  lastname: string;

  @IsString({
    message: 'El correo electrónico es inválido.',
  })
  @IsEmail(
    {},
    {
      message: 'El correo electrónico es inválido.',
    },
  )
  email: string;
}

export class GetUsersDto {
  @IsArray()
  @IsOptional()
  roleId: string[];

  @IsString()
  @IsOptional()
  statusCode: string;
}

export class EditUserDto {
  @IsString({ message: 'El nombre es requerido.' })
  @IsOptional()
  name: string;

  @IsString({ message: 'El apellido es requerido.' })
  @IsOptional()
  lastname: string;
}
