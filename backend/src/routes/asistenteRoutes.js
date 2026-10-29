import { Router } from 'express';
import {
  getHistorialYResumen,
  postMensajeChat,
  deleteHistorialChat,
  postJustificarTardanza,
} from '../controllers/asistenteController.js';

const router = Router();

// GET /api/asistente -> Obtiene resumen del día e historial de conversación
router.get('/', getHistorialYResumen);

// POST /api/asistente/chat -> Envía una consulta al Asistente IA (OpenAI + Supabase)
router.post('/chat', postMensajeChat);

// DELETE /api/asistente/historial -> Limpia el historial de chat
router.delete('/historial', deleteHistorialChat);

// POST /api/asistente/justificar -> Justifica una tardanza desde la tarjeta del chat
router.post('/justificar', postJustificarTardanza);

export default router;

