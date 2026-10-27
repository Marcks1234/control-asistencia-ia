-- ============================================================================
-- SCRIPT MAESTRO: SAAS B2B DE CONTROL DE ASISTENCIA BIOMÉTRICO E IA
-- Motor: PostgreSQL (Supabase)
-- Proyecto: Asistencia-IA (txtftxqhnqxpanptiudt)
-- ============================================================================

-- Habilitar extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PLANES COMERCIALES (Para Pagina Principal.png y Configuracion.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    limite_empleados INT,                    -- NULL = Empleados ilimitados
    limite_camaras INT,                      -- NULL = Cámaras ilimitadas (Ej: 4, 12, NULL)
    limite_sedes INT DEFAULT 1,              -- NULL = Múltiples sedes ilimitadas
    precio_mensual DECIMAL(10, 2) NOT NULL,
    caracteristicas JSONB DEFAULT '[]'::jsonb,
    es_recomendado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. EMPRESAS / TENANTS (Aislamiento Multi-Tenant y Registro Inicial)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE,                  -- Opcional en registro rápido / prueba gratis de 14 días
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    direccion TEXT,
    sector VARCHAR(100),
    logo_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CONFIGURACIÓN POR EMPRESA (Para Configuración.png y Camara IA.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuraciones_empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID UNIQUE NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    hora_entrada_general TIME DEFAULT '08:00:00',
    hora_salida_general TIME DEFAULT '17:00:00',
    tolerancia_global_minutos INT DEFAULT 15,
    dias_laborales TEXT[] DEFAULT ARRAY['LUN', 'MAR', 'MIE', 'JUE', 'VIE'],
    umbral_confianza_ia DECIMAL(3, 2) DEFAULT 0.60,     -- Distancia euclidiana máx (face-api.js)
    precision_minima_ia DECIMAL(5, 2) DEFAULT 95.00,    -- Slider UI: 80% a 99% (Configuración.png)
    deteccion_vida_activa BOOLEAN DEFAULT TRUE,         -- Liveness / Anti-spoofing toggle
    notificar_tardanzas BOOLEAN DEFAULT TRUE,
    notificar_inasistencias BOOLEAN DEFAULT TRUE,       -- Alertas de inasistencia automática
    permitir_marcacion_manual BOOLEAN DEFAULT TRUE,
    zona_horaria VARCHAR(50) DEFAULT 'America/Lima',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. SUSCRIPCIONES Y FACTURAS (Facturación SaaS y Prueba Gratis 14 Días)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_plan UUID NOT NULL REFERENCES planes(id) ON DELETE RESTRICT,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    renovacion BOOLEAN DEFAULT TRUE,
    estado VARCHAR(20) DEFAULT 'PRUEBA', -- 'ACTIVA', 'VENCIDA', 'CANCELADA', 'PRUEBA'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_suscripcion UUID REFERENCES suscripciones(id) ON DELETE SET NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PAGADA', 'PENDIENTE', 'VENCIDA', 'ANULADA'
    metodo_pago VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. USUARIOS ADMINISTRATIVOS (Login, Registro Local y OAuth Google/Microsoft)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,                -- Vinculación opcional con Supabase Auth (auth.users)
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash TEXT,                    -- Nullable para permitir registro con Google / Microsoft
    proveedor_auth VARCHAR(30) DEFAULT 'LOCAL', -- 'LOCAL', 'GOOGLE', 'MICROSOFT'
    telefono VARCHAR(20),
    cargo VARCHAR(100) DEFAULT 'Gerente RRHH',
    rol VARCHAR(30) DEFAULT 'GERENTE',       -- 'SUPERADMIN', 'GERENTE', 'RRHH', 'SUPERVISOR'
    avatar_url TEXT,
    terminos_aceptados BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. DEPARTAMENTOS Y HORARIOS (Estructura Organizacional)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    descripcion VARCHAR(100) NOT NULL, -- Ej: 'Turno Mañana'
    dias VARCHAR(50) NOT NULL,         -- Ej: 'Lunes a Viernes'
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    tolerancia_minutos INT DEFAULT 10,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. CÁMARAS Y PUNTOS DE ACCESO (Para Camara IA.png, Asistente IA.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS camaras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,            -- Ej: 'Cám 01 · Torniquete A'
    punto_acceso VARCHAR(100) NOT NULL,      -- Ej: 'ENTRADA PRINCIPAL', 'PASILLO TI', 'LOBBY PRINCIPAL'
    sede VARCHAR(100) DEFAULT 'Sede Central',
    stream_url TEXT,                         -- URL RTSP / HTTP / Dispositivo
    resolucion VARCHAR(50) DEFAULT '1080p 30fps',
    estado VARCHAR(30) DEFAULT 'OPERATIVA',  -- 'OPERATIVA', 'PAUSADA', 'DESCONECTADA'
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. EMPLEADOS (Para Gestión de Empleados.png y Camara IA.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_departamento UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    id_horario UUID REFERENCES horarios(id) ON DELETE SET NULL,
    codigo_biometrico VARCHAR(30),           -- Ej: 'BIO-7721', 'BIO-99428'
    dni VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    correo VARCHAR(150),
    telefono VARCHAR(20),
    foto_url TEXT,
    punto_acceso_habitual VARCHAR(100) DEFAULT 'Acceso Principal',
    -- Vector biométrico de 128 dimensiones extraído por face-api.js (CNN)
    descripcion_facial FLOAT8[],
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_dni_por_empresa UNIQUE (id_empresa, dni)
);

-- ----------------------------------------------------------------------------
-- 9. ASISTENCIAS (Para Entradas/Salida.png, Camara IA.png, Dashboard y Reportes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_empleado UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    id_camara UUID REFERENCES camaras(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIME,
    hora_salida TIME,
    minutos_tardanza INT DEFAULT 0,          -- Ej: 34 (+34 min tarde)
    horas_trabajadas DECIMAL(5, 2) DEFAULT 0,-- Ej: 5.22 (para nómina y reportes)
    estado VARCHAR(30) NOT NULL,             -- 'PRESENTE', 'TARDANZA', 'FALTA', 'JUSTIFICADO', 'PERMISO'
    metodo VARCHAR(30) DEFAULT 'BIOMETRIA_FACIAL', -- 'BIOMETRIA_FACIAL', 'MANUAL'
    punto_acceso VARCHAR(100),               -- Ej: 'Torniquete A (Cámara 01)'
    confianza_ia DECIMAL(5, 2),              -- Porcentaje de similitud biométrica (Ej: 98.70)
    observacion TEXT,                        -- Ej: '+34 min tarde', 'Sin aviso'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_asistencia_empleado_dia UNIQUE (id_empleado, fecha)
);

-- ----------------------------------------------------------------------------
-- 10. SOLICITUDES DE PERMISO (Justificaciones e Inasistencias)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_permiso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_empleado UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    id_usuario_aprobador UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. HISTORIAL DEL CHATBOT IA (Para Asistente IA.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,     -- Para renderizar tarjetas enriquecidas (ej. detalle de empleado tardío)
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. REPORTES Y EXPORTACIÓN (Para Reportes y Exportación.png)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'CONSOLIDADO_NOMINA', 'CONTROL_ASISTENCIA', 'BITACORA_BIOMETRICA', 'DEPARTAMENTAL'
    rango_fechas VARCHAR(50),
    datos JSONB NOT NULL,      -- Almacena el payload estructurado del reporte
    formato VARCHAR(15) DEFAULT 'PDF', -- 'PDF', 'EXCEL', 'CSV'
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. ALERTAS DEL SISTEMA (Para Alertas.png y campana de notificaciones)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    id_empleado UUID REFERENCES empleados(id) ON DELETE CASCADE,
    id_camara UUID REFERENCES camaras(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL, -- 'TARDANZA_REITERADA', 'FALLO_BIOMETRICO', 'INASISTENCIA', 'VISITANTE_EXTERNO', 'SISTEMA'
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    severidad VARCHAR(20) DEFAULT 'MEDIA', -- 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. ÍNDICES DE RENDIMIENTO MULTI-TENANT
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(id_empresa);
CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(id_empresa);
CREATE INDEX IF NOT EXISTS idx_horarios_empresa ON horarios(id_empresa);
CREATE INDEX IF NOT EXISTS idx_camaras_empresa ON camaras(id_empresa);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(id_empresa);
CREATE INDEX IF NOT EXISTS idx_empleados_departamento ON empleados(id_departamento);
CREATE INDEX IF NOT EXISTS idx_empleados_codigo_bio ON empleados(id_empresa, codigo_biometrico);
CREATE INDEX IF NOT EXISTS idx_asistencias_empresa_fecha ON asistencias(id_empresa, fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado ON asistencias(id_empleado);
CREATE INDEX IF NOT EXISTS idx_permisos_empresa_estado ON solicitudes_permiso(id_empresa, estado);
CREATE INDEX IF NOT EXISTS idx_chat_empresa_usuario ON historial_chat(id_empresa, id_usuario);
CREATE INDEX IF NOT EXISTS idx_reportes_empresa ON reportes(id_empresa);
CREATE INDEX IF NOT EXISTS idx_alertas_empresa_leida ON alertas(id_empresa, leida);

-- ----------------------------------------------------------------------------
-- 15. DATOS SEMILLA INICIALES (Alineados a Pagina Principal.png)
-- ----------------------------------------------------------------------------
INSERT INTO planes (nombre, limite_empleados, limite_camaras, limite_sedes, precio_mensual, caracteristicas, es_recomendado, activo)
VALUES
(
    'Básico',
    50,
    4,
    1,
    20.00,
    '["Hasta 4 cámaras activas", "Registro de hasta 50 empleados", "Alertas de seguridad básicas"]'::jsonb,
    FALSE,
    TRUE
),
(
    'Profesional',
    NULL,
    12,
    3,
    80.00,
    '["Hasta 12 cámaras activas", "Empleados ilimitados", "Análisis inteligente", "Alertas inmediatas", "Reportes exportables PDF"]'::jsonb,
    TRUE,
    TRUE
),
(
    'Empresa',
    NULL,
    NULL,
    NULL,
    199.00,
    '["Cámaras ilimitadas", "Soporte técnico inteligente", "Múltiples sedes", "Reportes Inteligentes"]'::jsonb,
    FALSE,
    TRUE
);


-- ----------------------------------------------------------------------------
-- 16. SEGURIDAD ROW LEVEL SECURITY (RLS) PARA SUPABASE
-- ----------------------------------------------------------------------------
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE camaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_permiso ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para el Backend API y clientes autenticados
CREATE POLICY "Acceso planes" ON planes FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso empresas" ON empresas FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso configuraciones_empresa" ON configuraciones_empresa FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso suscripciones" ON suscripciones FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso facturas" ON facturas FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso usuarios" ON usuarios FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso departamentos" ON departamentos FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso horarios" ON horarios FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso camaras" ON camaras FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso empleados" ON empleados FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso asistencias" ON asistencias FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso solicitudes_permiso" ON solicitudes_permiso FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso historial_chat" ON historial_chat FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso reportes" ON reportes FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
CREATE POLICY "Acceso alertas" ON alertas FOR ALL USING (auth.role() IN ('anon', 'authenticated', 'service_role')) WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
