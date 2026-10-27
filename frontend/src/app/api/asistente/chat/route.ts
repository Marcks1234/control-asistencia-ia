import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const cacheRespuestas = new Map<string, string>();

function obtenerFechaHoyPeru(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function querySupabase(endpoint: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { mensaje } = await req.json();

    if (!mensaje || !String(mensaje).trim()) {
      return NextResponse.json({ ok: false, error: 'Mensaje vacío' }, { status: 400 });
    }

    const consulta = String(mensaje).trim();
    const consultaNorm = consulta.toLowerCase();
    const fechaHoy = obtenerFechaHoyPeru();

    // 1. Obtener datos reales del día actual (fechaHoy) desde Supabase
    const [empleados, asistencias] = await Promise.all([
      querySupabase('empleados?select=id,nombre,apellido,codigo_biometrico,cargo,punto_acceso_habitual,dni,departamentos(nombre)&activo=eq.true'),
      querySupabase(`asistencias?fecha=eq.${fechaHoy}&select=id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,estado,punto_acceso,confianza_ia,observacion&order=created_at.desc`),
    ]);

    const mapaAsistencia = new Map<string, any>();
    for (const a of asistencias as any[]) {
      if (!mapaAsistencia.has(a.id_empleado)) {
        mapaAsistencia.set(a.id_empleado, a);
      }
    }

    let presentes = 0;
    let tardanzas = 0;
    let ausentes = 0;

    const datosColaboradores = (empleados as any[]).map((emp) => {
      const asist = mapaAsistencia.get(emp.id);
      const estado = asist?.estado || 'FALTA';
      if (estado === 'FALTA') ausentes++;
      else if (estado === 'TARDANZA') tardanzas++;
      else presentes++;

      return {
        id: emp.id,
        nombre: `${emp.nombre} ${emp.apellido}`,
        dni: emp.dni,
        cargo: emp.cargo,
        departamento: emp.departamentos?.nombre || 'Operaciones',
        codigo_biometrico: emp.codigo_biometrico,
        estado,
        hora_entrada: asist?.hora_entrada ? asist.hora_entrada.slice(0, 5) : 'Sin registro',
        hora_salida: asist?.hora_salida ? asist.hora_salida.slice(0, 5) : 'En curso',
        minutos_tardanza: asist?.minutos_tardanza || 0,
        punto_acceso: asist?.punto_acceso || emp.punto_acceso_habitual || 'Torniquete A (Cámara 01)',
        confianza_ia: asist?.confianza_ia ? Number(asist.confianza_ia) : 98.4,
        motivo: asist?.observacion || 'Sin observaciones',
      };
    });

    const empleadoTardanza =
      datosColaboradores.find((c) => c.estado === 'TARDANZA') ||
      datosColaboradores.find((c) => c.minutos_tardanza > 0) ||
      datosColaboradores.find((c) => c.codigo_biometrico === 'BIO-7721') ||
      datosColaboradores[0];
    let respuestaTexto = '';
    let metadata: any = {};

    // Clave de caché incluye el estado actual para nunca devolver conteos desactualizados
    const claveCache = `${consultaNorm}|${presentes}-${tardanzas}-${ausentes}`;

    if (consultaNorm === '¿quién llegó tarde hoy y cuál es el motivo?' || consultaNorm === '¿quién llegó tarde hoy?') {
      if (empleadoTardanza && empleadoTardanza.estado === 'TARDANZA') {
        respuestaTexto = `Hoy (${fechaHoy}) se registra ${tardanzas} tardanza en la base de datos: ${empleadoTardanza.nombre} (${empleadoTardanza.codigo_biometrico}) del área de ${empleadoTardanza.departamento}, quien ingresó a las ${empleadoTardanza.hora_entrada} (+${empleadoTardanza.minutos_tardanza} min). Motivo: ${empleadoTardanza.motivo}.`;
      } else {
        respuestaTexto = `Hoy (${fechaHoy}) no se registran tardanzas pendientes en la base de datos (${presentes} presentes y ${ausentes} ausentes).`;
      }
    } else if (consultaNorm === 'ver reporte de operaciones') {
      const opList = datosColaboradores.filter((c) => c.departamento.toLowerCase().includes('operaciones'));
      const detalleOp = opList.map((c) => `${c.nombre}: ${c.estado} (${c.hora_entrada})`).join(' | ');
      respuestaTexto = `Reporte de Operaciones de hoy (${opList.length} colaboradores): ${detalleOp}.`;
    } else if (consultaNorm === 'generar resumen del día') {
      const detalleGeneral = datosColaboradores.map((c) => `${c.nombre} (${c.departamento}): ${c.estado}`).join(', ');
      respuestaTexto = `Resumen de asistencia de hoy ${fechaHoy} (${datosColaboradores.length} colaboradores): ${presentes} presentes, ${tardanzas} tardanza y ${ausentes} ausentes. Detalle: ${detalleGeneral}.`;
    } else if (cacheRespuestas.has(claveCache)) {
      respuestaTexto = cacheRespuestas.get(claveCache)!;
    } else if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
      try {
        const resumenCompacto = datosColaboradores
          .map((c) => `${c.nombre}[${c.codigo_biometrico},${c.departamento}]:${c.estado}(Entrada:${c.hora_entrada},+${c.minutos_tardanza}m,${c.motivo})`)
          .join('; ');

        const systemPrompt = `Eres AsistenciaAI. Responde en español, breve y directo (máx 3 oraciones) usando solo estos datos reales de hoy (${fechaHoy}): Total=${datosColaboradores.length}, Presentes=${presentes}, Tardanzas=${tardanzas}, Ausentes=${ausentes}. Personal: ${resumenCompacto}`;

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: consulta },
            ],
            temperature: 0.2,
            max_tokens: 140,
          }),
        });

        if (openAiRes.ok) {
          const aiJson = await openAiRes.json();
          respuestaTexto = aiJson.choices?.[0]?.message?.content?.trim() || '';
          if (respuestaTexto) {
            cacheRespuestas.set(claveCache, respuestaTexto);
          }
        }
      } catch (err: any) {
        console.warn('[OpenAI Fallback]', err.message);
      }
    }

    if (!respuestaTexto) {
      respuestaTexto = `Según los registros de hoy (${fechaHoy}), contamos con ${presentes} presentes, ${tardanzas} tardanza y ${ausentes} ausentes de un total de ${datosColaboradores.length} colaboradores.`;
    }

    if (
      empleadoTardanza &&
      (consultaNorm.includes('tarde') ||
        consultaNorm.includes('tardanza') ||
        consultaNorm.includes('miguel') ||
        consultaNorm.includes('7721'))
    ) {
      metadata = {
        tipo: 'TARJETA_TARDANZA',
        empleado: {
          id: empleadoTardanza.id,
          iniciales: empleadoTardanza.nombre
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          nombre: empleadoTardanza.nombre,
          dni: empleadoTardanza.dni,
          cargo: empleadoTardanza.cargo,
          codigo_biometrico: empleadoTardanza.codigo_biometrico,
          departamento: empleadoTardanza.departamento,
          turno: 'Turno Mañana (08:00 AM)',
          minutos_tardanza: empleadoTardanza.minutos_tardanza,
          hora_entrada: `${empleadoTardanza.hora_entrada} AM`,
          punto_acceso: empleadoTardanza.punto_acceso,
          confianza_ia: empleadoTardanza.confianza_ia,
          motivo: empleadoTardanza.motivo,
          estado: empleadoTardanza.estado,
        },
      };
    }

    let filaGuardada: any = null;
    try {
      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/historial_chat`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id_empresa: '11111111-1111-1111-1111-111111111111',
          id_usuario: '22222222-2222-2222-2222-222222222222',
          mensaje: consulta,
          respuesta: respuestaTexto,
          metadata,
        }),
      });
      if (saveRes.ok) {
        const arr = await saveRes.json();
        filaGuardada = Array.isArray(arr) ? arr[0] : arr;
      }
    } catch (saveErr) {
      console.warn('[Supabase Save Error]', saveErr);
    }

    return NextResponse.json({
      ok: true,
      interaccion: {
        id: filaGuardada?.id || `msg-${Date.now()}`,
        mensaje: consulta,
        respuesta: respuestaTexto,
        metadata,
        fecha: filaGuardada?.fecha || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
