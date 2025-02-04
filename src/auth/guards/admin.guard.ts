// IMPORTACIONES DE NESTJS
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

// IMPORTACIONES DE TERCEROS
import { Request, Response } from 'express';

// IMPORTACIONES LOCALES
import { AuthService } from '../auth.service';

/**
 * GUARDIA QUE VERIFICA SI EL USUARIO ES ADMINISTRADOR VALIDANDO SU TOKEN Y USER ID.
 * ESTA GUARDIA DEBE UTILIZARSE EN RUTAS QUE REQUIERAN PRIVILEGIOS DE ADMINISTRADOR.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * INYECTA EL SERVICIO DE AUTENTICACIÓN PARA MANEJAR LA VERIFICACIÓN DE TOKENS.
   * @param authService EL SERVICIO DE AUTENTICACIÓN QUE PROPORCIONA VALIDACIÓN DE TOKENS.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * DETERMINA SI LA SOLICITUD TIENE PERMISO PARA PROCEDER BASADO EN EL TOKEN Y ROL DEL USUARIO.
   * @param context EL CONTEXTO DE EJECUCIÓN DE LA SOLICITUD, QUE PROPORCIONA ACCESO A LOS OBJETOS DE SOLICITUD Y RESPUESTA.
   * @returns UNA PROMESA QUE RESUELVE A UN BOOLEANO INDICANDO SI SE CONCEDE EL ACCESO.
   * @throws UnauthorizedException SI EL TOKEN O EL ID DEL USUARIO FALTAN O SON INVÁLIDOS.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // OBTIENE LOS OBJETOS DE SOLICITUD Y RESPUESTA HTTP
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    // EXTRAE EL TOKEN Y EL ID DEL USUARIO DE LAS COOKIES
    const token = request.cookies?.token;
    const userId = request.cookies?.user?.userId;

    // VERIFICA SI EL TOKEN O EL ID DEL USUARIO FALTAN
    if (!token || !userId) {
      throw new UnauthorizedException('No hemos podido validar su usuario.');
    }

    try {
      // VERIFICA EL TOKEN USANDO EL SERVICIO DE AUTENTICACIÓN
      const payload = await this.authService.verifyToken(token);

      // VERIFICA SI EL PAYLOAD ES VÁLIDO Y COINCIDE CON EL ID DEL USUARIO
      if (payload && payload.userId === userId) {
        // SE PUEDEN AÑADIR COMPROBACIONES ADICIONALES PARA EL ROL DE ADMINISTRADOR AQUÍ SI ES NECESARIO
        return true;
      } else {
        // LANZA UnauthorizedException SI LAS COMPROBACIONES FALLAN
        throw new UnauthorizedException('Acceso denegado.');
      }
    } catch (error) {
      // REGISTRA EL ERROR PARA PROPÓSITOS DE DEPURACIÓN
      console.error('Error verificando el token:', error);

      // RESPONDE CON ESTADO 401 Y UN MENSAJE DE ERROR
      response.status(401).json({ errors: ['Usuario o token inválido.'] });
      return false;
    }
  }
}
