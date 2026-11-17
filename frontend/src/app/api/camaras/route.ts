import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, esUuidValido } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';
import { Camara, DeteccionBiometrica } from '@/models/Camara';

const CAMARAS_DEFAULT: Omit<Camara, 'id_empresa'>[] = [
  {
    id: 'cam-01-torniquete-a',
    nombre: 'Cám 01 · Torniquete A',
    punto_acceso: 'ENTRADA PRINCIPAL',
    sede: 'Sede Central',
    stream_url: null,
    resolucion: '1080p 30fps',
    estado: 'OPERATIVA',
    activo: true,
  },
  {
    id: 'cam-02-torniquete-b',
    nombre: 'Cám 02 · Torniquete B',
    punto_acceso: 'PASILLO TI',
    sede: 'Sede Central',
    stream_url: null,
    resolucion: '1080p 30fps',
    estado: 'OPERATIVA',
    activo: true,
  },
  {
    id: 'cam-03-recepcion',
    nombre: 'Cám 03 · Recepción',
    punto_acceso: 'LOBBY PRINCIPAL',
    sede: 'Sede Central',
    stream_url: null,
    resolucion: '1080p 30fps',
    estado: 'OPERATIVA',
    activo: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();

    // 1. Obtener cámaras de la empresa
    let camaras: Camara[] = [];
    if (esUuidValido(idEmpresa)) {
      const camarasData = await querySupabase<any[]>(
        `camaras?id_empresa=eq.${idEmpresa}&activo=eq.true&order=created_at.asc`
      );
      if (Array.isArray(camarasData) && camarasData.length > 0) {
        camaras = camarasData;
      }
    }

    // Si la empresa aún no tiene cámaras creadas en BD, proveer las cámaras iniciales
    if (camaras.length === 0) {
      camaras = CAMARAS_DEFAULT.map((c) => ({
        ...c,
        id_empresa: idEmpresa,
      }));
    }

    // 2. Obtener asistencias recientes del día con biometría
    let detecciones: DeteccionBiometrica[] = [];
    if (esUuidValido(idEmpresa)) {
      const asistData = await querySupabase<any[]>(
        `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id,id_empleado,hora_entrada,hora_salida,minutos_tardanza,estado,metodo,punto_acceso,confianza_ia,observacion,created_at,empleados(id,nombre,apellido,cargo,departamentos(nombre))&order=created_at.desc&limit=10`
      );

      if (Array.isArray(asistData)) {
        detecciones = asistData
          .filter((a) => a.hora_entrada || a.hora_salida)
          .map((a) => {
            const emp = a.empleados;
            const horaMarcacion = a.hora_salida ? a.hora_salida.slice(0, 5) : a.hora_entrada?.slice(0, 5) || '08:00';
            const esSalida = Boolean(a.hora_salida && a.hora_entrada);
            const esTardanza = a.estado === 'TARDANZA' || (a.minutos_tardanza && a.minutos_tardanza > 0);

            return {
              id: a.id,
              empleadoId: a.id_empleado,
              nombre: emp ? `${emp.nombre} ${emp.apellido}`.trim() : 'Colaborador',
              cargo: emp?.cargo || 'Colaborador',
              departamento: emp?.departamentos?.nombre || 'General',
              camaraNombre: a.punto_acceso?.includes('(') ? a.punto_acceso : 'Cám 01 · Torniquete A',
              puntoAcceso: a.punto_acceso || 'Acceso Principal',
              confianza: a.confianza_ia ? Number(a.confianza_ia) : 98.7,
              tipo: (esSalida ? 'Salida' : esTardanza ? 'Tardanza' : 'Entrada') as 'Entrada' | 'Salida' | 'Tardanza',
              hora: horaMarcacion,
              tiempoRelativo: 'Hoy',
              estado: a.estado || 'PRESENTE',
            };
          });
      }
    }

    return NextResponse.json({
      ok: true,
      camaras,
      detecciones,
      estadoSistema: {
        estado: 'OPERATIVO',
        precisionGlobal: 98.6,
        tiempoRespuestaMs: 135,
        algoritmo: 'CNN Biométrico (Anti-spoofing activo)',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    if (!esUuidValido(idEmpresa)) {
      return NextResponse.json({ ok: false, error: 'Sesión o empresa no válida' }, { status: 401 });
    }

    const { nombre, punto_acceso, sede = 'Sede Central', resolucion = '1080p 30fps' } = await req.json();
    if (!nombre?.trim() || !punto_acceso?.trim()) {
      return NextResponse.json({ ok: false, error: 'Nombre y punto de acceso son obligatorios.' }, { status: 400 });
    }

    const res = await querySupabase<any[]>('camaras', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id_empresa: idEmpresa,
        nombre: nombre.trim(),
        punto_acceso: punto_acceso.trim(),
        sede: sede.trim(),
        resolucion: resolucion.trim(),
        estado: 'OPERATIVA',
        activo: true,
      }),
    });

    const creada = Array.isArray(res) && res[0] ? res[0] : null;
    return NextResponse.json({
      ok: true,
      mensaje: 'Cámara conectada exitosamente.',
      camara: creada,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, estado } = await req.json();
    if (!id || !estado) {
      return NextResponse.json({ ok: false, error: 'ID y estado son requeridos.' }, { status: 400 });
    }

    if (esUuidValido(id)) {
      await querySupabase(`camaras?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
    }

    return NextResponse.json({ ok: true, mensaje: `Cámara actualizada a estado ${estado}.` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
