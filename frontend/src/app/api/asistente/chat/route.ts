import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverContextoEmpresa } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const cacheRespuestas = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { mensaje, id_empresa: bodyEmpresaId } = await req.json();
    if (!mensaje?.trim()) return NextResponse.json({ ok: false, error: 'Mensaje vacío.' }, { status: 400 });

    const { idEmpresa, nombreUsuario, idUsuario, empresaNombre } = resolverContextoEmpresa(req, bodyEmpresaId);
    const consulta = String(mensaje).trim();
    const consultaNorm = consulta.toLowerCase();
    const fechaHoy = obtenerFechaHoyPeru();

    const [empleados, asistencias] = await Promise.all([
      querySupabase<any[]>(
        `empleados?id_empresa=eq.${idEmpresa}&select=id,nombre,apellido,codigo_biometrico,cargo,punto_acceso_habitual,dni,departamentos(nombre)&activo=eq.true`
      ),
      querySupabase<any[]>(
        `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id_empleado,fecha,hora_entrada,hora_salida,minutos_tardanza,estado,punto_acceso,confianza_ia,observacion&order=created_at.desc`
      ),
    ]);

    const listaEmpleados = Array.isArray(empleados) ? empleados : [];
    const listaAsistencias = Array.isArray(asistencias) ? asistencias : [];

    const mapa = new Map<string, any>();
    for (const a of listaAsistencias) {
      if (!mapa.has(a.id_empleado)) mapa.set(a.id_empleado, a);
    }

    let presentes = 0;
    let tardanzas = 0;
    let ausentes = 0;

    const datosColaboradores = listaEmpleados.map((emp) => {
      const asist = mapa.get(emp.id);
      const estado = asist?.estado ? String(asist.estado).toUpperCase() : 'FALTA';
      if (estado === 'FALTA') ausentes++;
      else if (estado === 'TARDANZA') tardanzas++;
      else presentes++;

      return {
        id: emp.id,
        nombre: `${emp.nombre} ${emp.apellido}`.trim(),
        dni: emp.dni,
        cargo: emp.cargo || 'Colaborador',
        departamento: emp.departamentos?.nombre || 'Operaciones',
        codigo_biometrico: emp.codigo_biometrico || 'BIO-0000',
        estado,
        hora_entrada: asist?.hora_entrada ? asist.hora_entrada.slice(0, 5) : 'Sin registro',
        hora_salida: asist?.hora_salida ? asist.hora_salida.slice(0, 5) : 'En curso',
        minutos_tardanza: asist?.minutos_tardanza || 0,
        punto_acceso: asist?.punto_acceso || emp.punto_acceso_habitual || 'Torniquete Central',
        confianza_ia: asist?.confianza_ia ? Number(asist.confianza_ia) : 98.4,
        motivo: asist?.observacion || 'Sin observaciones',
      };
    });

    const empleadoTardanza =
      datosColaboradores.find((c) => c.estado === 'TARDANZA') ||
      datosColaboradores.find((c) => c.minutos_tardanza > 0) ||
      datosColaboradores[0];

    let respuestaTexto = '';
    let metadata: any = {};
    const claveCache = `${idEmpresa}|${consultaNorm}|${presentes}-${tardanzas}-${ausentes}`;

    if (consultaNorm === '¿quién llegó tarde hoy y cuál es el motivo?' || consultaNorm === '¿quién llegó tarde hoy?') {
      if (empleadoTardanza?.estado === 'TARDANZA') {
        respuestaTexto = `Hoy (${fechaHoy}) en ${empresaNombre} se registra ${tardanzas} tardanza: ${empleadoTardanza.nombre} (${empleadoTardanza.codigo_biometrico}) del área de ${empleadoTardanza.departamento}, quien ingresó a las ${empleadoTardanza.hora_entrada} (+${empleadoTardanza.minutos_tardanza} min). Motivo: ${empleadoTardanza.motivo}.`;
      } else {
        respuestaTexto = `Hoy (${fechaHoy}) en ${empresaNombre} no se registran tardanzas (${presentes} presentes y ${ausentes} ausentes).`;
      }
    } else if (consultaNorm === 'ver reporte de operaciones') {
      const opList = datosColaboradores.filter((c) => c.departamento.toLowerCase().includes('operaciones'));
      const det = opList.map((c) => `${c.nombre}: ${c.estado} (${c.hora_entrada})`).join(' | ');
      respuestaTexto = `Reporte de Operaciones (${opList.length} colaboradores): ${det || 'Sin registros'}.`;
    } else if (consultaNorm === 'generar resumen del día') {
      const det = datosColaboradores.map((c) => `${c.nombre}: ${c.estado}`).join(', ');
      respuestaTexto = `Resumen de hoy ${fechaHoy} (${datosColaboradores.length} colaboradores): ${presentes} presentes, ${tardanzas} tardanza y ${ausentes} ausentes. Detalle: ${det}.`;
    } else if (cacheRespuestas.has(claveCache)) {
      respuestaTexto = cacheRespuestas.get(claveCache)!;
    } else if (OPENAI_API_KEY?.startsWith('sk-')) {
      try {
        const resumen = datosColaboradores
          .map((c) => `${c.nombre}[${c.cargo},${c.departamento}]:${c.estado}(${c.hora_entrada},+${c.minutos_tardanza}m,${c.motivo})`)
          .join('; ');

        const systemPrompt = `Asistente RRHH para "${empresaNombre}". Usuario: "${nombreUsuario}". Responde breve en español (máx 3 oraciones) usando solo estos datos reales: Total colaboradores = ${datosColaboradores.length}, Presentes = ${presentes}, Tardanzas = ${tardanzas}, Ausentes = ${ausentes}. Personal: ${resumen || 'Ninguno'}. Si preguntan cuántos empleados hay, responde ${datosColaboradores.length}.`;

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: consulta }],
            temperature: 0.2,
            max_tokens: 160,
          }),
        });

        if (openAiRes.ok) {
          const aiJson = await openAiRes.json();
          respuestaTexto = aiJson.choices?.[0]?.message?.content?.trim() || '';
          if (respuestaTexto) cacheRespuestas.set(claveCache, respuestaTexto);
        }
      } catch {}
    }

    if (!respuestaTexto) {
      respuestaTexto = `En ${empresaNombre}, hoy (${fechaHoy}) cuentas con ${datosColaboradores.length} colaboradores: ${presentes} presentes, ${tardanzas} con tardanza y ${ausentes} ausentes.`;
    }

    if (
      empleadoTardanza &&
      (consultaNorm.includes('tarde') || consultaNorm.includes('tardanza') || consultaNorm.includes(empleadoTardanza.nombre.toLowerCase().split(' ')[0]))
    ) {
      metadata = {
        tipo: 'TARJETA_TARDANZA',
        empleado: {
          id: empleadoTardanza.id,
          iniciales: empleadoTardanza.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
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

    if (idEmpresa) {
      querySupabase('historial_chat', {
        method: 'POST',
        body: JSON.stringify({ id_empresa: idEmpresa, id_usuario: idUsuario || null, mensaje: consulta, respuesta: respuestaTexto, metadata, fecha: new Date().toISOString() }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      interaccion: {
        id: `chat-${Date.now()}`,
        mensaje: consulta,
        respuesta: respuestaTexto,
        metadata,
        fecha: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
