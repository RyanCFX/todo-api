// IMPORTACIONES DE NESTJS
import { Injectable } from '@nestjs/common';

// IMPORTACIONES DE TERCEROS
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * ESTRATEGIA JWT PARA LA AUTENTICACIÓN DE USUARIOS.
 * ESTA CLASE UTILIZA PASSPORT Y JWT PARA VALIDAR LOS TOKENS DE AUTENTICACIÓN.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * CONFIGURA LA ESTRATEGIA JWT, ESPECIFICANDO CÓMO EXTRAER EL TOKEN Y LA CLAVE SECRETA.
   */
  constructor() {
    super({
      // CONFIGURA EL MÉTODO DE EXTRACCIÓN DEL TOKEN DESDE EL ENCABEZADO AUTORIZACIÓN COMO BEARER TOKEN
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // INDICA SI SE DEBE IGNORAR LA EXPIRACIÓN DEL TOKEN
      ignoreExpiration: false,
      // CLAVE SECRETA UTILIZADA PARA FIRMAR Y VERIFICAR LOS TOKENS
      secretOrKey: 'abc123',
    });
  }

  /**
   * VALIDA EL PAYLOAD DEL TOKEN JWT.
   * ESTE MÉTODO SE EJECUTA DESPUÉS DE QUE EL TOKEN ES VERIFICADO CON ÉXITO.
   * @param payload EL PAYLOAD DEL TOKEN DECODIFICADO, QUE CONTIENE LA INFORMACIÓN DEL USUARIO.
   * @returns EL PAYLOAD VALIDADO, QUE NORMALMENTE CONTIENE LA INFORMACIÓN DEL USUARIO AUTENTICADO.
   */
  validate(payload: any) {
    // DEVUELVE EL PAYLOAD TAL CUAL; PUEDES AÑADIR LÓGICA ADICIONAL PARA VALIDACIONES EXTRA.
    return payload;
  }
}
