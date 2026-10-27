import {
  obtenerEstadoInicialChat,
  procesarMensajeChat,
  limpiarHistorial,
  justificarAsistenciaEmpleado,
} from '../services/asistenteService.js';

export async function getHistorialYResumen(req, res) {
  try {
    const data = await obtenerEstadoInicialChat();
    return res.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error al obtener el historial del Asistente IA',
    });
  }
}

export async function postMensajeChat(req, res) {
  try {
    const { mensaje } = req.body;
    if (!mensaje || ! String(mensaje).trim()) {
      return res.status(400).json({
        ok: false,
        error: 'El mensaje de consulta es obligatorio.',
      });
    }

    const respuesta = await procesarMensajeChat({ mensaje: String(mensaje).trim() });
    return res.json({
      ok: true,
      interaccion: respuesta,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error al procesar la consulta con el Asistente IA',
    });
  }
}

export async function deleteHistorialChat(req, res) {
  try {
    const result = await limpiarHistorial();
    if (!result.ok) {
      return res.status(500).json(result);
    }
    return res.json({
      ok: true,
      mensaje: 'Historial del chat limpiado correctamente.',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error al limpiar el historial del chat',
    });
  }
}

export async function postJustificarTardanza(req, res) {
  try {
    const { idEmpleado, motivo } = req.body;
    if (!idEmpleado) {
      return res.status(400).json({
        ok: false,
        error: 'El identificador del empleado es obligatorio.',
      });
    }

    const result = await justificarAsistenciaEmpleado({ idEmpleado, motivo });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error al justificar la asistencia',
    });
  }
}

