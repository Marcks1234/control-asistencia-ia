import { NextRequest, NextResponse } from 'next/server';
import { querySupabase, resolverIdEmpresa, esUuidValido } from '@/lib/supabase';
import { obtenerFechaHoyPeru } from '@/lib/utils';
import { Camara, DeteccionBiometrica, parseCamaraStreamMeta } from '@/models/Camara';

function mapCamara(c: any): Camara {
  const meta = parseCamaraStreamMeta(c.stream_url);
  return {
    ...c,
    tipo_fuente: meta.tipo_fuente,
    device_id: meta.device_id,
    modo_acceso: meta.modo_acceso,
  };
}

export async function GET(req: NextRequest) {
  try {
    const idEmpresa = resolverIdEmpresa(req);
    const fechaHoy = obtenerFechaHoyPeru();

    let camaras: Camara[] = [];
    let detecciones: DeteccionBiometrica[] = [];

    if (esUuidValido(idEmpresa)) {
      const [camarasData, asistData] = await Promise.all([
        querySupabase<any[]>(`camaras?id_empresa=eq.${idEmpresa}&activo=eq.true&order=created_at.asc`),
        querySupabase<any[]>(
          `asistencias?id_empresa=eq.${idEmpresa}&fecha=eq.${fechaHoy}&select=id,id_empleado,hora_entrada,hora_salida,minutos_tardanza,estado,metodo,punto_acceso,confianza_ia,observacion,created_at,empleados(id,nombre,apellido,cargo,foto_url,departamentos(nombre))&order=created_at.desc&limit=15`
        ),
      ]);

      if (Array.isArray(camarasData)) camaras = camarasData.map(mapCamara);

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
              foto_url: emp?.foto_url || null,
              camaraNombre: a.punto_acceso || 'Cámara Biométrica',
              puntoAcceso: a.punto_acceso || 'Acceso Principal',
              confianza: a.confianza_ia ? Number(a.confianza_ia) : 95.0,
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
        algoritmo: 'Biometría Facial',
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

    const { nombre, punto_acceso, sede = 'Principal', resolucion = '1080p 30fps', stream_url = null } = await req.json();
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
        stream_url: stream_url || null,
        resolucion: resolucion.trim(),
        estado: 'OPERATIVA',
        activo: true,
      }),
    });

    const creadaRaw = Array.isArray(res) && res[0] ? res[0] : null;
    if (!creadaRaw) {
      return NextResponse.json({ ok: false, error: 'No se pudo guardar la cámara en Supabase.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Cámara conectada exitosamente.',
      camara: mapCamara(creadaRaw),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, estado, stream_url } = await req.json();
    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID es requerido.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (estado !== undefined) updates.estado = estado;
    if (stream_url !== undefined) updates.stream_url = stream_url;

    if (esUuidValido(id) && Object.keys(updates).length > 0) {
      await querySupabase(`camaras?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    }

    return NextResponse.json({ ok: true, mensaje: 'Cámara actualizada correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id || !esUuidValido(id)) {
      return NextResponse.json({ ok: false, error: 'ID de cámara inválido.' }, { status: 400 });
    }

    await querySupabase(`camaras?id=eq.${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true, mensaje: 'Cámara desconectada y eliminada.' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
