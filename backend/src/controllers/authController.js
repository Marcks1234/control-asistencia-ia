import { authService } from '../services/authService.js';

/**
 * Controlador de Autenticación JWT, Registro y Recuperación de Contraseña SaaS
 */
export const authController = {
  /**
   * POST /api/auth/registro
   */
  async registrar(req, res) {
    try {
      const resultado = await authService.registrarEmpresaYGerente(req.body);
      return res.status(201).json({
        ok: true,
        mensaje: 'Empresa y cuenta de Gerente registradas exitosamente.',
        token: resultado.token,
        data: resultado,
      });
    } catch (error) {
      console.error('[AuthController.registrar] Error:', error.message);
      return res.status(400).json({
        ok: false,
        error: error.message || 'No se pudo completar el registro.',
      });
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const resultado = await authService.autenticarUsuario(req.body);
      return res.status(200).json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso.',
        token: resultado.token,
        data: resultado,
      });
    } catch (error) {
      console.error('[AuthController.login] Error:', error.message);
      return res.status(401).json({
        ok: false,
        error: error.message || 'Credenciales inválidas.',
      });
    }
  },

  /**
   * GET /api/auth/perfil (Ruta protegida por JWT)
   */
  async perfil(req, res) {
    return res.status(200).json({
      ok: true,
      usuario: req.usuario,
    });
  },

  /**
   * POST /api/auth/recuperar
   */
  async solicitarRecuperacion(req, res) {
    try {
      const { correo } = req.body;
      const resultado = await authService.solicitarRecuperacionContrasena(correo);
      return res.status(200).json({
        ok: true,
        mensaje: resultado.enviadoPorGmail
          ? `Se envió un código de 6 dígitos por Gmail a ${resultado.destinatarioFinal}.`
          : 'Código de recuperación generado correctamente.',
        data: resultado,
      });
    } catch (error) {
      console.error('[AuthController.solicitarRecuperacion] Error:', error.message);
      return res.status(400).json({
        ok: false,
        error: error.message || 'No se pudo procesar la solicitud de recuperación.',
      });
    }
  },

  /**
   * POST /api/auth/restablecer
   */
  async restablecerContrasena(req, res) {
    try {
      const resultado = await authService.restablecerContrasena(req.body);
      return res.status(200).json({
        ok: true,
        mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
        data: resultado,
      });
    } catch (error) {
      console.error('[AuthController.restablecerContrasena] Error:', error.message);
      return res.status(400).json({
        ok: false,
        error: error.message || 'No se pudo restablecer la contraseña.',
      });
    }
  },

  /**
   * GET /api/auth/planes
   */
  async obtenerPlanes(req, res) {
    try {
      const planes = await authService.listarPlanes();
      return res.status(200).json({
        ok: true,
        planes,
      });
    } catch (error) {
      console.error('[AuthController.obtenerPlanes] Error:', error.message);
      return res.status(500).json({
        ok: false,
        error: 'Error al consultar los planes comerciales.',
      });
    }
  },
};
