import { verificarTokenJWT } from '../utils/jwt.js';

/**
 * Middleware Express para proteger rutas mediante validación de JWT
 */
export function verificarAutenticacionJWT(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)asistencia_token=([^;]*)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Acceso denegado. Token JWT no proporcionado.',
      });
    }

    const payload = verificarTokenJWT(token);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: error.message || 'Token JWT inválido o expirado.',
    });
  }
}

