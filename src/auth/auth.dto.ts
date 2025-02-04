import { IsString, IsEmail, IsOptional } from 'class-validator';

export class AuthPayloadDto {
  username: string;

  password: string;
}

export class SignupDto {
  @IsString({ message: 'El nombre es requerido.' })
  name: string;

  @IsString({ message: 'El apellido es requerido.' })
  lastname: string;

  @IsString({ message: 'La contraseña es requerida.' })
  password: string;

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

  // @IsString({
  //   message: 'SO - Ocurrió un error inesperado, favor reportar.',
  // })
  // os: string;
}

export class SigninDto {
  @IsString({ message: 'La contraseña es requerida.' })
  password: string;

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
  // @IsString({
  //   message: 'SO - Ocurrió un error inesperado, favor reportar.',
  // })
  // os: string;
}

export class RemoveUserDto {
  @IsString({ message: 'La contraseña es requerida.' })
  password: string;
}

export class RestorePasswordDto {
  @IsString({ message: 'La contraseña es requerida.' })
  password: string;
}

export class SendValidationCodeDto {
  @IsString({ message: 'El correo electrónico es requerido.' })
  email: string;
}

export class GetLast3PhoneDto {
  @IsString({ message: 'El correo electrónico es requerido.' })
  email: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual es requerida.' })
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña es requerida.' })
  newPassword: string;
}
