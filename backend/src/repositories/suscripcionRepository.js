import { supabase } from '../config/supabase.js';

/**
 * Repositorio para Suscripciones y Planes Comerciales
 * Implementa consultas parametrizadas
 */
export const suscripcionRepository = {
  /**
   * Obtiene todos los planes comerciales activos
   */
  async obtenerPlanes() {
    const { data, error } = await supabase
      .from('planes')
      .select('id, nombre, limite_empleados, limite_camaras, limite_sedes, precio_mensual, caracteristicas, es_recomendado, activo')
      .eq('activo', true)
      .order('precio_mensual', { ascending: true });

    if (error) throw new Error(`Error al obtener planes: ${error.message}`);
    return data || [];
  },

  /**
   * Obtiene un plan por su UUID o el recomendado por defecto
   */
  async obtenerPlanPorId(idPlan) {
    if (idPlan) {
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .eq('id', idPlan)
        .maybeSingle();

      if (error) throw new Error(`Error al obtener plan: ${error.message}`);
      if (data) return data;
    }

    // Si no se encuentra o no se pasa, tomar el recomendado o el primero
    const { data: planDefault, error: errDef } = await supabase
      .from('planes')
      .select('*')
      .eq('activo', true)
      .order('es_recomendado', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errDef) throw new Error(`Error al obtener plan por defecto: ${errDef.message}`);
    return planDefault;
  },

  /**
   * Crea una suscripción activa para una empresa
   */
  async crearSuscripcion({ id_empresa, id_plan, meses = 1, estado = 'ACTIVA' }) {
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + (meses * 30));

    const { data, error } = await supabase
      .from('suscripciones')
      .insert([
        {
          id_empresa,
          id_plan,
          fecha_inicio: fechaInicio.toISOString().slice(0, 10),
          fecha_fin: fechaFin.toISOString().slice(0, 10),
          renovacion: true,
          estado,
        },
      ])
      .select('id, id_empresa, id_plan, fecha_inicio, fecha_fin, estado, planes(nombre, precio_mensual)')
      .single();

    if (error) throw new Error(`Error al crear suscripción: ${error.message}`);
    return data;
  },

  /**
   * Obtiene la suscripción activa de una empresa
   */
  async obtenerSuscripcionPorEmpresa(idEmpresa) {
    const { data, error } = await supabase
      .from('suscripciones')
      .select('id, id_empresa, id_plan, fecha_inicio, fecha_fin, estado, planes(nombre, precio_mensual, limite_empleados, limite_camaras)')
      .eq('id_empresa', idEmpresa)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener suscripción: ${error.message}`);
    return data;
  },
};

