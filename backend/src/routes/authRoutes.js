import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { verificarAutenticacionJWT } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas de Autenticación JWT, Registro y Recuperación de Contraseña SaaS
router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', verificarAutenticacionJWT, authController.perfil);
router.post('/recuperar', authController.solicitarRecuperacion);
router.post('/restablecer', authController.restablecerContrasena);
router.get('/planes', authController.obtenerPlanes);

export default router;
