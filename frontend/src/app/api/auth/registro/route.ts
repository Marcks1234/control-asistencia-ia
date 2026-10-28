import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generarTokenJWT } from '@/lib/jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txtftxqhnqxpanptiudt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const SALT = 'AsistenciaAI_B2B_Salt_2026';

function hashearContrasena(password: string): string {
  return crypto.createHash('sha256').update(`${password}_${SALT}`).digest('hex');
}

async function querySupabase(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error(`[Supabase Auth Error] ${endpoint}:`, res.status, errorText);
    return null;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombreEmpresa,
      ruc,
      telefono = '',
      ciudad = 'Lima',
      nombreGerente,
      apellidoGerente,
      correo,
      password,
      idPlan,
    } = body;

    // 1. Validaciones
    if (!nombreEmpresa?.trim()) {
      return NextResponse.json({ ok: false, error: 'El nombre de la empresa es obligatorio.' }, { status: 400 });
    }
    if (!ruc?.trim() || !/^\d{11}$/.test(ruc.trim())) {
      return NextResponse.json({ ok: false, error: 'El RUC debe tener 11 dígitos numéricos.' }, { status: 400 });
    }
    if (!nombreGerente?.trim() || !apellidoGerente?.trim()) {
      return NextResponse.json({ ok: false, error: 'Nombre y apellido del encargado son obligatorios.' }, { status: 400 });
    }
    if (!correo?.trim() || !correo.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener mínimo 6 caracteres.' }, { status: 400 });
    }

    const emailNorm = correo.trim().toLowerCase();
    const rucNorm = ruc.trim();

    // 2. Verificar duplicados
    const [empCheck, usrCheck] = await Promise.all([
      querySupabase(`empresas?ruc=eq.${rucNorm}&select=id&limit=1`),
      querySupabase(`usuarios?correo=eq.${encodeURIComponent(emailNorm)}&select=id&limit=1`),
    ]);

    if (Array.isArray(empCheck) && empCheck.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Ya existe una empresa registrada con el RUC ${rucNorm}.` },
        { status: 400 }
      );
    }

    if (Array.isArray(usrCheck) && usrCheck.length > 0) {
      return NextResponse.json(
        { ok: false, error: `El correo ${emailNorm} ya está registrado en el sistema.` },
        { status: 400 }
      );
    }

    // 3. Obtener plan comercial seleccionado (o recomendado)
    let planIdFinal = idPlan;
    if (!planIdFinal) {
      const planes = await querySupabase('planes?es_recomendado=eq.true&select=id&limit=1');
      if (Array.isArray(planes) && planes.length > 0) {
        planIdFinal = planes[0].id;
      }
    }

    // 4. Crear Empresa
    const nuevaEmpresaData = await querySupabase('empresas', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        nombre: nombreEmpresa.trim(),
        ruc: rucNorm,
        telefono: telefono?.trim() || null,
        ciudad: ciudad?.trim() || 'Lima',
        activo: true,
      }),
    });

    const empresa = Array.isArray(nuevaEmpresaData) ? nuevaEmpresaData[0] : nuevaEmpresaData;
    if (!empresa?.id) {
      throw new Error('No se pudo crear el registro de empresa.');
    }

    // 5. Crear Configuración Inicial
    await querySupabase('configuraciones_empresa', {
      method: 'POST',
      body: JSON.stringify({
        id_empresa: empresa.id,
        umbral_confianza_ia: 0.60,
        tolerancia_global_minutos: 10,
        notificar_tardanzas: true,
        notificar_inasistencias: true,
        permitir_marcacion_manual: true,
        zona_horaria: 'America/Lima',
      }),
    });

    // 6. Crear Suscripción Activa
    const hoy = new Date();
    const fin = new Date();
    fin.setDate(fin.getDate() + 30);

    await querySupabase('suscripciones', {
      method: 'POST',
      body: JSON.stringify({
        id_empresa: empresa.id,
        id_plan: planIdFinal,
        fecha_inicio: hoy.toISOString().slice(0, 10),
        fecha_fin: fin.toISOString().slice(0, 10),
        renovacion: true,
        estado: 'ACTIVA',
      }),
    });

    // 7. Crear Usuario Gerente
    const hash = hashearContrasena(password);
    const nuevoUsuarioData = await querySupabase('usuarios', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id_empresa: empresa.id,
        nombre: nombreGerente.trim(),
        apellido: apellidoGerente.trim(),
        correo: emailNorm,
        contrasena_hash: hash,
        rol: 'GERENTE',
        activo: true,
      }),
    });

    const usuario = Array.isArray(nuevoUsuarioData) ? nuevoUsuarioData[0] : nuevoUsuarioData;

    // 8. Emitir Token JWT para sesión inmediata
    const token = generarTokenJWT({
      sub: usuario?.id || empresa.id,
      id_empresa: empresa.id,
      correo: emailNorm,
      nombre: nombreGerente.trim(),
      apellido: apellidoGerente.trim(),
      rol: 'GERENTE',
      empresa_nombre: empresa.nombre,
    });

    const response = NextResponse.json(
      {
        ok: true,
        mensaje: 'Registro completado con éxito. Bienvenido a Asistencia-IA.',
        token,
        data: {
          token,
          usuario: {
            id: usuario?.id,
            id_empresa: empresa.id,
            nombre: nombreGerente.trim(),
            apellido: apellidoGerente.trim(),
            correo: emailNorm,
            rol: 'GERENTE',
          },
          empresa: {
            id: empresa.id,
            nombre: empresa.nombre,
            ruc: empresa.ruc,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set('asistencia_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('[API /api/auth/registro] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
