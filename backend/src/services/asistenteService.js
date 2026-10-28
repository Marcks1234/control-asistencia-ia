import { supabase } from '../config/supabase.js';

/**
 * Formatea una hora SQL (ej. '08:34:00') a formato legible ('08:34 AM')
 */
function formatearHora(horaSql) {
  if (!horaSql) return 'Sin registro';
  const partes = horaSql.split(':');
  let horas = parseInt(partes[0], 10);
  const minutos = partes[1] || '00';
  const ampm = horas >= 12 ? 'PM' : 'AM';
  horas = horas % 12 || 12;
  return `${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;
}

/**
 * Obtiene el contexto real de asistencia, empleados y departamentos desde Supabase
 */
export async function obtenerContextoAsistencia(idEmpresa) {
  if (!idEmpresa) {
    return {
      resumen: { presentes: 0, tardanzas: 0, ausentes: 0, total_plantilla: 0, puntualidad_semanal: '100%' },
      colaboradores: [],
      tardanzas: [],
      faltas: [],
    };
  }

  const { data: empleados } = await supabase
    .from('empleados')
    .select(`
      id,
      codigo_biometrico,
      dni,
      nombre,
      apellido,
      cargo,
      punto_acceso_habitual,
      departamentos ( nombre ),
      horarios ( descripcion, hora_entrada, hora_salida )
    `)
    .eq('id_empresa', idEmpresa)
    .eq('activo', true);

  const { data: asistencias } = await supabase
    .from('asistencias')
    .select(`
      id,
      id_empleado,
      fecha,
      hora_entrada,
      hora_salida,
      minutos_tardanza,
      horas_trabajadas,
      estado,
      metodo,
      punto_acceso,
      confianza_ia,
      observacion
    `)
    .eq('id_empresa', idEmpresa)
    .order('created_at', { ascending: false });

  const listaEmpleados = empleados || [];
  const listaAsistencias = asistencias || [];

  // Mapa rápido de asistencia por empleado
  const mapaAsistencia = new Map();
  for (const asist of listaAsistencias) {
    if (!mapaAsistencia.has(asist.id_empleado)) {
      mapaAsistencia.set(asist.id_empleado, asist);
    }
  }

  const detalleColaboradores = listaEmpleados.map((emp) => {
    const asist = mapaAsistencia.get(emp.id);
    const iniciales = `${emp.nombre?.[0] || ''}${emp.apellido?.[0] || ''}`.toUpperCase();
    const depto = emp.departamentos?.nombre || 'Operaciones';
    const turnoDesc = emp.horarios?.descripcion || 'Turno Mañana';
    const horaTurno = emp.horarios?.hora_entrada ? formatearHora(emp.horarios.hora_entrada) : '08:00 AM';

    return {
      id: emp.id,
      iniciales,
      nombre: `${emp.nombre} ${emp.apellido}`,
      dni: emp.dni,
      cargo: emp.cargo || 'Colaborador',
      codigo_biometrico: emp.codigo_biometrico || 'BIO-0000',
      departamento: depto,
      turno: `${turnoDesc} (${horaTurno})`,
      estado: asist?.estado || 'FALTA',
      minutos_tardanza: asist?.minutos_tardanza ?? 0,
      hora_entrada: asist?.hora_entrada ? formatearHora(asist.hora_entrada) : 'Sin marcación',
      punto_acceso: asist?.punto_acceso || emp.punto_acceso_habitual || 'Torniquete Central',
      confianza_ia: asist?.confianza_ia ? Number(asist.confianza_ia) : 98.5,
      motivo: asist?.observacion || 'Sin observaciones registradas',
    };
  });

  const presentesReales = detalleColaboradores.filter(
    (c) => c.estado === 'PRESENTE' || c.estado === 'JUSTIFICADO'
  );
  const tardanzasReales = detalleColaboradores.filter((c) => c.estado === 'TARDANZA');
  const faltasReales = detalleColaboradores.filter((c) => c.estado === 'FALTA');
  const totalReal = detalleColaboradores.length || 1;
  const pctPuntualidad = Math.round(((presentesReales.length) / totalReal) * 100);

  return {
    resumen: {
      presentes: presentesReales.length,
      tardanzas: tardanzasReales.length,
      ausentes: faltasReales.length,
      total_plantilla: detalleColaboradores.length,
      puntualidad_semanal: `${pctPuntualidad}%`,
    },
    colaboradores: detalleColaboradores,
    tardanzas: tardanzasReales,
    faltas: faltasReales,
  };
}

/**
 * Construye una respuesta inteligente basada en los datos reales de Supabase
 * Se usa como motor directo o respaldo cuando no hay OPENAI_API_KEY activa
 */
function generarRespuestaContextual(mensajeUsuario, contexto) {
  const texto = mensajeUsuario.toLowerCase();
  const empleadoTarde = contexto.tardanzas[0] || contexto.colaboradores[0];

  if (
    texto.includes('tarde') ||
    texto.includes('tardanza') ||
    texto.includes('motivo')
  ) {
    if (empleadoTarde && empleadoTarde.estado === 'TARDANZA') {
      return {
        respuesta: `Hoy se registró ${contexto.resumen.tardanzas} tardanza en el turno: ${empleadoTarde.nombre} (${empleadoTarde.codigo_biometrico}) ingresó a las ${empleadoTarde.hora_entrada} (+${empleadoTarde.minutos_tardanza} min) por ${empleadoTarde.punto_acceso}. Motivo reportado: ${empleadoTarde.motivo}.`,
        metadata: {
          tipo: 'TARJETA_TARDANZA',
          empleado: empleadoTarde,
        },
      };
    }
    return {
      respuesta: `Hoy no se registran tardanzas en tu empresa (${contexto.resumen.presentes} presentes y ${contexto.resumen.ausentes} ausentes).`,
      metadata: {},
    };
  }

  if (texto.includes('operaciones') || texto.includes('departamento') || texto.includes('area') || texto.includes('área')) {
    const deptoOp = contexto.colaboradores.filter((c) => c.departamento.toLowerCase().includes('operaciones'));
    const nombresOp = deptoOp.map((c) => `${c.nombre} (${c.estado})`).join(', ');
    return {
      respuesta: `En el área de Operaciones tenemos ${deptoOp.length} colaboradores monitoreados: ${nombresOp || 'Sin registros en el área'}.`,
      metadata: {},
    };
  }

  if (texto.includes('resumen') || texto.includes('día') || texto.includes('dia') || texto.includes('hoy') || texto.includes('general')) {
    const presentesNombres = contexto.colaboradores
      .filter((c) => c.estado === 'PRESENTE')
      .map((c) => `${c.nombre} (${c.hora_entrada})`)
      .join(', ');

    return {
      respuesta: `Resumen ejecutivo del día: Contamos con ${contexto.resumen.presentes} colaboradores presentes (${contexto.resumen.puntualidad_semanal} de puntualidad), ${contexto.resumen.tardanzas} tardanza y ${contexto.resumen.ausentes} ausencias. Ingresos puntuales: ${presentesNombres || 'Ninguno registrado aún'}.`,
      metadata: {},
    };
  }

  if (texto.includes('ausente') || texto.includes('falta') || texto.includes('inasistencia')) {
    const ausente = contexto.faltas[0];
    return {
      respuesta: ausente
        ? `Actualmente figuran ${contexto.resumen.ausentes} colaboradores ausentes. En el registro destaca ${ausente.nombre} (${ausente.codigo_biometrico} - ${ausente.departamento}) sin marcación de entrada.`
        : `Hoy tenemos ${contexto.resumen.ausentes} colaboradores ausentes en el turno actual.`,
      metadata: {},
    };
  }

  return {
    respuesta: `He consultado la base de datos de tu empresa en tiempo real: hoy registramos ${contexto.resumen.presentes} presentes, ${contexto.resumen.tardanzas} con tardanza y ${contexto.resumen.ausentes} ausentes de un total de ${contexto.resumen.total_plantilla} colaboradores.`,
    metadata: {},
  };
}

const cacheRespuestas = new Map();

/**
 * Llama a la API de OpenAI si existe OPENAI_API_KEY en el entorno;
 * optimiza tokens resolviendo sugerencias rápidas localmente y cacheando consultas repetidas.
 */
export async function procesarMensajeChat({ mensaje, idEmpresa, idUsuario }) {
  const contexto = await obtenerContextoAsistencia(idEmpresa);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  let resultado = generarRespuestaContextual(mensaje, contexto);

  const claveCache = mensaje.toLowerCase().trim();
  const esConsultaRapida =
    claveCache === '¿quién llegó tarde hoy y cuál es el motivo?' ||
    claveCache === '¿quién llegó tarde hoy?' ||
    claveCache === 'ver reporte del departamento de operaciones' ||
    claveCache === 'generar resumen ejecutivo de asistencia del día';

  if (cacheRespuestas.has(claveCache)) {
    resultado.respuesta = cacheRespuestas.get(claveCache);
  } else if (!esConsultaRapida && apiKey && apiKey !== 'tu_api_key_aqui' && apiKey.startsWith('sk-')) {
    try {
      const listaCompacta = contexto.colaboradores
        .map((c) => `${c.nombre}(${c.codigo_biometrico},${c.departamento}):${c.estado} ${c.hora_entrada}${c.minutos_tardanza ? ` +${c.minutos_tardanza}m` : ''}`)
        .join(' | ');

      const systemPrompt = `Asistente RRHH AsistenciaAI. Responde en español, breve (máx 3 líneas). Datos reales BD de la empresa: Presentes=${contexto.resumen.presentes}, Tardanzas=${contexto.resumen.tardanzas}, Ausentes=${contexto.resumen.ausentes}. Personal: ${listaCompacta}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: mensaje.slice(0, 250) },
          ],
          temperature: 0.2,
          max_tokens: 140,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textoIA = data.choices?.[0]?.message?.content?.trim();
        if (textoIA) {
          resultado.respuesta = textoIA;
          cacheRespuestas.set(claveCache, textoIA);
        }
      }
    } catch (err) {
      console.warn('[AsistenteIA] Usando motor contextual de respaldo:', err.message);
    }
  }

  // Guardar la interacción en Supabase (tabla historial_chat)
  let idRegistro = `chat-${Date.now()}`;
  if (idEmpresa) {
    const { data: filaGuardada } = await supabase
      .from('historial_chat')
      .insert([
        {
          id_empresa: idEmpresa,
          id_usuario: idUsuario || null,
          mensaje,
          respuesta: resultado.respuesta,
          metadata: resultado.metadata || {},
        },
      ])
      .select()
      .single();

    if (filaGuardada?.id) idRegistro = filaGuardada.id;
  }

  return {
    id: idRegistro,
    mensaje,
    respuesta: resultado.respuesta,
    metadata: resultado.metadata || {},
    fecha: new Date().toISOString(),
  };
}

/**
 * Obtiene el historial completo del chat y el resumen del día desde Supabase
 */
export async function obtenerEstadoInicialChat(idEmpresa) {
  if (!idEmpresa) {
    return {
      resumen: { presentes: 0, tardanzas: 0, ausentes: 0, total_plantilla: 0, puntualidad_semanal: '100%' },
      colaboradores: [],
      historial: [],
    };
  }

  const contexto = await obtenerContextoAsistencia(idEmpresa);

  const { data: historial } = await supabase
    .from('historial_chat')
    .select('id, mensaje, respuesta, metadata, fecha')
    .eq('id_empresa', idEmpresa)
    .order('fecha', { ascending: true })
    .limit(50);

  return {
    resumen: contexto.resumen,
    colaboradores: contexto.colaboradores,
    historial: historial || [],
  };
}

/**
 * Limpia el historial de conversación en Supabase
 */
export async function limpiarHistorial(idEmpresa) {
  if (!idEmpresa) return { ok: true, error: null };

  const { error } = await supabase
    .from('historial_chat')
    .delete()
    .eq('id_empresa', idEmpresa);

  return { ok: !error, error: error?.message || null };
}

/**
 * Justifica la tardanza de un empleado directamente en Supabase
 */
export async function justificarAsistenciaEmpleado({
  idEmpleado,
  motivo = 'Tardanza justificada por Gerencia RRHH desde Asistente IA',
  idEmpresa,
  idUsuario,
}) {
  if (!idEmpresa || !idEmpleado) {
    return { ok: false, error: 'Parámetros requeridos ausentes.' };
  }

  // Actualizar asistencia del empleado
  const { error: errAsist } = await supabase
    .from('asistencias')
    .update({
      estado: 'JUSTIFICADO',
      observacion: motivo,
    })
    .eq('id_empresa', idEmpresa)
    .eq('id_empleado', idEmpleado);

  // Registrar solicitud de permiso aprobada
  if (idUsuario) {
    await supabase.from('solicitudes_permiso').insert([
      {
        id_empresa: idEmpresa,
        id_empleado: idEmpleado,
        id_usuario_aprobador: idUsuario,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: new Date().toISOString().slice(0, 10),
        motivo,
        estado: 'APROBADO',
      },
    ]);
  }

  return {
    ok: !errAsist,
    mensaje: 'La tardanza del colaborador ha sido justificada correctamente en el sistema.',
  };
}
