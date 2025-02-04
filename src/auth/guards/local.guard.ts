// IMPORTACIONES DE NESTJS
import { ExecutionContext, Injectable } from '@nestjs/common';

// IMPORTACIONES DE TERCEROS
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * GUARDIA QUE UTILIZA LA ESTRATEGIA 'LOCAL' PARA AUTENTICAR USUARIOS.
 * ESTE GUARDIA UTILIZA LA AUTENTICACIÓN LOCAL PROPORCIONADA POR PASSPORT.
 */
@Injectable()
export class LocalGuard extends AuthGuard('local') {
  /**
   * DETERMINA SI LA SOLICITUD TIENE PERMISO PARA PROCEDER UTILIZANDO LA ESTRATEGIA LOCAL.
   * PUEDE REGRESAR UN BOOLEANO SINCRÓNICO, UNA PROMESA O UN OBSERVABLE.
   * @param context EL CONTEXTO DE EJECUCIÓN DE LA SOLICITUD.
   * @returns UN BOOLEANO, PROMESA O OBSERVABLE QUE INDICA SI SE CONCEDE EL ACCESO.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // MENSAJE DE DEPURACIÓN PARA INDICAR LA EJECUCIÓN DEL GUARDIA
    console.log('Hello, World');

    // LLAMA A LA IMPLEMENTACIÓN ORIGINAL DEL MÉTODO CANACTIVATE DE AUTHGUARD
    return super.canActivate(context);
  }
}
