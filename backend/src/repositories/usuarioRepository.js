import { supabase } from '../config/supabase.js';

/**
 * Repositorio para la entidad Usuarios Administrativos (Gerentes / RRHH)
 * Implementa consultas parametrizadas
 */
export const usuarioRepository = {
  /**
   * Busca un usuario por su correo electrónico
   */
  async buscarPorCorreo(correo) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(
        'id, id_empresa, nombre, apellido, correo, contrasena_hash, rol, activo, avatar_url, codigo_recuperacion, expiracion_recuperacion, created_at'
      )
      .eq('correo', correo.trim().toLowerCase())
      .maybeSingle();

    if (error) throw new Error(`Error al buscar usuario por correo: ${error.message}`);
    return data;
  },

  /**
   * Busca un usuario por su UUID
   */
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, id_empresa, nombre, apellido, correo, rol, activo, avatar_url, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al buscar usuario por ID: ${error.message}`);
    return data;
  },

  /**
   * Registra un nuevo usuario administrativo
   */
  async crear({ id_empresa, nombre, apellido, correo, contrasena_hash, rol = 'GERENTE', avatar_url = null }) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          id_empresa,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: correo.trim().toLowerCase(),
          contrasena_hash,
          rol,
          avatar_url,
          activo: true,
        },
      ])
      .select('id, id_empresa, nombre, apellido, correo, rol, activo, created_at')
      .single();

    if (error) throw new Error(`Error al crear usuario: ${error.message}`);
    return data;
  },

  /**
   * Guarda el código temporal de recuperación de contraseña y su fecha de expiración
   */
  async guardarCodigoRecuperacion(correo, codigo, expiracionIso) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        codigo_recuperacion: codigo,
        expiracion_recuperacion: expiracionIso,
      })
      .eq('correo', correo.trim().toLowerCase())
      .select('id, correo, nombre')
      .single();

    if (error) throw new Error(`Error al guardar código de recuperación: ${error.message}`);
    return data;
  },

  /**
   * Actualiza la contraseña del usuario y limpia el código de recuperación usado
   */
  async actualizarContrasena(correo, nuevoHash) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        contrasena_hash: nuevoHash,
        codigo_recuperacion: null,
        expiracion_recuperacion: null,
      })
      .eq('correo', correo.trim().toLowerCase())
      .select('id, correo, nombre, apellido')
      .single();

    if (error) throw new Error(`Error al actualizar contraseña: ${error.message}`);
    return data;
  },
};
