import { supabase } from '../config/supabase.js';
import { Empresa } from '../models/Empresa.js';

/**
 * Repositorio para la entidad Empresa (Tenant SaaS)
 * Utiliza consultas parametrizadas para prevenir inyecciones SQL
 */
export const empresaRepository = {
  /**
   * Busca una empresa por su RUC
   */
  async buscarPorRuc(ruc) {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nombre, ruc, telefono, ciudad, direccion, activo, created_at')
      .eq('ruc', ruc)
      .maybeSingle();

    if (error) throw new Error(`Error al buscar empresa por RUC: ${error.message}`);
    return data ? new Empresa(data) : null;
  },

  /**
   * Busca una empresa por su UUID
   */
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nombre, ruc, telefono, ciudad, direccion, activo, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al buscar empresa por ID: ${error.message}`);
    return data ? new Empresa(data) : null;
  },

  /**
   * Inserta una nueva empresa en Supabase
   */
  async crear({ nombre, ruc, telefono = '', ciudad = '', direccion = '', logo_url = null }) {
    const { data, error } = await supabase
      .from('empresas')
      .insert([
        {
          nombre: nombre.trim(),
          ruc: ruc.trim(),
          telefono: telefono?.trim() || null,
          ciudad: ciudad?.trim() || 'Lima',
          direccion: direccion?.trim() || null,
          logo_url,
          activo: true,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`Error al crear empresa: ${error.message}`);
    return data ? new Empresa(data) : null;
  },

  /**
   * Crea la configuración inicial por defecto para una nueva empresa
   */
  async crearConfiguracionInicial(idEmpresa) {
    const { data, error } = await supabase
      .from('configuraciones_empresa')
      .insert([
        {
          id_empresa: idEmpresa,
          umbral_confianza_ia: 0.60,
          tolerancia_global_minutos: 10,
          notificar_tardanzas: true,
          notificar_inasistencias: true,
          permitir_marcacion_manual: true,
          zona_horaria: 'America/Lima',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`Error al crear configuración de empresa: ${error.message}`);
    return data;
  },
};
