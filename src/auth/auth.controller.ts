// IMPORTACIONES DE NESTJS
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

// IMPORTACIONES DE TERCEROS
import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

// IMPORTACIONES LOCALES
import {
  ChangePasswordDto,
  GetLast3PhoneDto,
  RestorePasswordDto,
  SendValidationCodeDto,
  SigninDto,
  SignupDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { format, formatErrors } from 'src/utils/helpers';

@Controller('auth')
/**
 * CONTROLADOR PARA LAS OPERACIONES DE AUTENTICACIÓN.
 * MANEJA RUTAS COMO SIGNUP, SIGNIN, VALIDACIÓN DE CÓDIGOS, Y MÁS.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * REGISTRA UN NUEVO USUARIO EN EL SISTEMA.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param body DATOS DE REGISTRO DEL USUARIO.
   * @param userAgent INFORMACIÓN DEL AGENTE DE USUARIO.
   * @returns DATOS DEL USUARIO REGISTRADO.
   */
  @Post('signup')
  async signup(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SignupDto,
  ) {
    try {
      // CONVIERTE LOS DATOS DE LA SOLICITUD EN UNA INSTANCIA DE SignupDto
      const dto = plainToClass(SignupDto, body);
      // VALIDA LOS DATOS UTILIZANDO CLASS-VALIDATOR
      const errors = await validate(dto);

      // SI HAY ERRORES DE VALIDACIÓN, RETORNA UN ESTADO 400 CON LOS ERRORES
      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA REGISTRAR AL USUARIO
      const response = await this.authService.signup(req.body, {
        userAgent: req.headers['user-agent'],
        ip: format.ip(req.ip),
      });

      // ESTABLECE COOKIES CON EL TOKEN Y LOS DATOS DEL USUARIO
      res.cookie('tokenn', response.token, {
        httpOnly: true,
        sameSite: 'lax', // Permite enviar cookies sin HTTPS
        // No requiere HTTPS para pruebas locales
        domain: 'localhost', // No uses dominios específicos aquí
      });
      res.cookie('userr', response.user, {
        httpOnly: true,
        sameSite: 'lax', // Permite enviar cookies sin HTTPS
        // No requiere HTTPS para pruebas locales
        domain: 'localhost', // No uses dominios específicos aquí
      });

      // RETORNA LOS DATOS DEL USUARIO REGISTRADO
      return res.status(200).json(response.user);
    } catch (error) {
      console.log(error);

      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * INICIA SESIÓN DE UN USUARIO EXISTENTE.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param body DATOS DE INICIO DE SESIÓN DEL USUARIO.
   * @returns DATOS DEL USUARIO AUTENTICADO.
   */
  @Post('signin')
  async signin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SigninDto,
  ) {
    try {
      // console.log('req.headers.referer');
      // console.log(req.headers.origin);
      // console.log(req.headers.referer);
      // console.log('req.headers.referer');

      // CONVIERTE LOS DATOS DE LA SOLICITUD EN UNA INSTANCIA de SigninDto
      const dto = plainToClass(SigninDto, body);
      // VALIDA LOS DATOS UTILIZANDO CLASS-VALIDATOR
      const errors = await validate(dto);

      // SI HAY ERRORES DE VALIDACIÓN, RETORNA UN ESTADO 400 CON LOS ERRORES
      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      // LLAMA AL SERVICIO DE AUTE`NTICACIÓN PARA INICIAR SESIÓN
      const response = await this.authService.signin(req.body);

      // ESTABLECE COOKIES CON EL TOKEN Y LOS DATOS DEL USUARIO
      res.cookie('token', response.token, {
        httpOnly: true,
        sameSite: 'none',
        priority: 'high',
        secure: true,
      });
      res.cookie('user', response.user, {
        httpOnly: true,
        sameSite: 'none',
        priority: 'high',
        secure: true,
      });
      // RETORNA LOS DATOS DEL USUARIO AUTENTICADO
      return res.status(200).json(response?.user);
    } catch (error) {
      console.log(error);

      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  @Post('signout')
  async signout(@Res() res: Response) {
    try {
      res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'none',
        priority: 'high',
        secure: true,
      });
      res.cookie('user', '', {
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'none',
        priority: 'high',
        secure: true,
      });

      return res.status(200).json();
    } catch (error) {
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * OBTIENE LA SESIÓN ACTUAL DEL USUARIO AUTENTICADO.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @returns DATOS DE LA SESIÓN DEL USUARIO.
   */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  async getSession(@Req() req: Request, @Res() res: Response) {
    try {
      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA OBTENER LA SESIÓN DEL USUARIO
      const response = await this.authService.getSession(
        req.cookies.user.userId,
      );

      // ACTUALIZA LAS COOKIES CON EL NUEVO TOKEN Y LOS DATOS DEL USUARIO
      res.cookie('token', response.token, { httpOnly: true });
      res.cookie(
        'user',
        { ...response.user, os: req.cookies.user.os },
        { httpOnly: true },
      );

      // RETORNA LOS DATOS DE LA SESIÓN DEL USUARIO
      return res
        .status(200)
        .json({ ...response.user, os: req.cookies.user.os });
    } catch (error) {
      console.log(error);

      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * ENVÍA UN CÓDIGO DE VALIDACIÓN AL USUARIO.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param type TIPO DE VALIDACIÓN (ej. email, phone).
   * @param userAgent INFORMACIÓN DEL AGENTE DE USUARIO.
   * @param body DATOS PARA ENVIAR EL CÓDIGO DE VALIDACIÓN.
   * @returns RESULTADO DE LA OPERACIÓN.
   */
  @Post('sendValidationCode/:type')
  async sendValidationCode(
    @Req() req: Request,
    @Res() res: Response,
    @Param('type') type: string,
    @Headers('user-agent') userAgent: string,
    @Body() body: SendValidationCodeDto,
  ) {
    try {
      // CONVIERTE LOS DATOS DE LA SOLICITUD EN UNA INSTANCIA de SendValidationCodeDto
      const dto = plainToClass(SendValidationCodeDto, body);
      // VALIDA LOS DATOS UTILIZANDO CLASS-VALIDATOR
      const errors = await validate(dto);

      // SI HAY ERRORES DE VALIDACIÓN, RETORNA UN ESTADO 400 CON LOS ERRORES
      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      // OBTIENE LA DIRECCIÓN IP DEL USUARIO
      const splited = req.ip.split(':');
      const ip = splited[splited?.length - 1];

      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA ENVIAR EL CÓDIGO DE VALIDACIÓN
      const response = await this.authService.sendValidationCode(
        body,
        userAgent,
        ip,
        type,
      );

      // RETORNA EL RESULTADO DE LA OPERACIÓN
      return res.status(200).json(response);
    } catch (error) {
      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * VALIDA EL CÓDIGO DE VALIDACIÓN PROPORCIONADO POR EL USUARIO.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param code CÓDIGO DE VALIDACIÓN.
   * @param userAgent INFORMACIÓN DEL AGENTE DE USUARIO.
   * @returns RESPUESTA VACÍA EN CASO DE ÉXITO.
   */
  @Post('validateCode')
  @UseGuards(JwtAuthGuard)
  async validateCode(
    @Req() req: Request,
    @Res() res: Response,
    @Body('code') code: string,
    @Body('email') email: string,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA VALIDAR EL CÓDIGO
      const response = await this.authService.validateCode(
        email,
        code,
        userAgent,
        format.ip(req.ip),
      );

      res.cookie('userId', response.userId, {
        httpOnly: true,
        sameSite: 'none',
        priority: 'high',
        secure: true,
      });
      // RETORNA UNA RESPUESTA VACÍA CON ESTADO 200
      return res.status(200).json();
    } catch (error) {
      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * RESTABLECE LA CONTRASEÑA DEL USUARIO.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param body DATOS PARA RESTABLECER LA CONTRASEÑA.
   * @param userAgent INFORMACIÓN DEL AGENTE DE USUARIO.
   * @returns RESPUESTA VACÍA EN CASO DE ÉXITO.
   */
  @Post('restorePassword')
  @UseGuards(JwtAuthGuard)
  async restorePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RestorePasswordDto,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      // CONVIERTE LOS DATOS DE LA SOLICITUD EN UNA INSTANCIA de RestorePasswordDto
      const dto = plainToClass(RestorePasswordDto, body);
      // VALIDA LOS DATOS UTILIZANDO CLASS-VALIDATOR
      const errors = await validate(dto);

      // SI HAY ERRORES DE VALIDACIÓN, RETORNA UN ESTADO 400 CON LOS ERRORES
      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA RESTABLECER LA CONTRASEÑA
      await this.authService.restorePassword(
        req.cookies.userId,
        body?.password,
        userAgent,
        format.ip(req.ip),
      );

      res.cookie('userId', '', { expires: new Date(0) });

      // RETORNA UNA RESPUESTA VACÍA CON ESTADO 200
      return res.status(200).json();
    } catch (error) {
      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * VALIDA EL CÓDIGO DE VALIDACIÓN DE REGISTRO PROPORCIONADO POR EL USUARIO.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param code CÓDIGO DE VALIDACIÓN.
   * @returns RESPUESTA VACÍA EN CASO DE ÉXITO.
   */
  @Post('validateSignupCode/:code')
  @UseGuards(JwtAuthGuard)
  async validateSignupCode(
    @Req() req: Request,
    @Res() res: Response,
    @Param('code') code: string,
  ) {
    try {
      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA VALIDAR EL CÓDIGO DE REGISTRO
      await this.authService.validateSignupCode(
        code,
        format.transactionData(req),
      );

      // RETORNA UNA RESPUESTA VACÍA CON ESTADO 200
      return res.status(200).json();
    } catch (error) {
      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }

  /**
   * INICIA SESIÓN DE UN USUARIO EXISTENTE.
   * @param req OBJETO DE SOLICITUD HTTP.
   * @param res OBJETO DE RESPUESTA HTTP.
   * @param body DATOS DE INICIO DE SESIÓN DEL USUARIO.
   * @returns DATOS DEL USUARIO AUTENTICADO.
   */
  @Post('changePassword')
  async changePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ChangePasswordDto,
  ) {
    try {
      // CONVIERTE LOS DATOS DE LA SOLICITUD EN UNA INSTANCIA de ChangePasswordDto
      const dto = plainToClass(ChangePasswordDto, body);
      // VALIDA LOS DATOS UTILIZANDO CLASS-VALIDATOR
      const errors = await validate(dto);

      // SI HAY ERRORES DE VALIDACIÓN, RETORNA UN ESTADO 400 CON LOS ERRORES
      if (errors.length > 0) {
        return res.status(400).json({ errors: formatErrors(errors) });
      }

      // LLAMA AL SERVICIO DE AUTENTICACIÓN PARA CAMBIAR CONTRASEÑA
      const response = await this.authService.changePassword(
        req.body,
        format.transactionData(req),
      );

      // RETORNA LOS DATOS DEL USUARIO AUTENTICADO
      return res.status(200).json(response);
    } catch (error) {
      console.log(error);

      // MANAJA ERRORES Y RETORNA EL ESTADO CORRESPONDIENTE
      return res.status(error.status || 500).json({ errors: error.errors });
    }
  }
}
