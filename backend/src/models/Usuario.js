/**
 * Modelo de Dominio: Usuario Administrativo (Gerente / RRHH)
 */
export class Usuario {
  constructor({
    id,
    id_empresa,
    nombre,
    apellido,
    correo,
    contrasena_hash = null,
    rol = 'GERENTE',
    avatar_url = null,
    activo = true,
    codigo_recuperacion = null,
    expiracion_recuperacion = null,
    created_at = null,
  }) {
    this.id = id;
    this.id_empresa = id_empresa;
    this.nombre = nombre?.trim();
    this.apellido = apellido?.trim();
    this.correo = correo?.trim().toLowerCase();
    this.contrasena_hash = contrasena_hash;
    this.rol = rol;
    this.avatar_url = avatar_url;
    this.activo = Boolean(activo);
    this.codigo_recuperacion = codigo_recuperacion;
    this.expiracion_recuperacion = expiracion_recuperacion;
    this.created_at = created_at;
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  esGerente() {
    return this.rol === 'GERENTE';
  }

  toJSON() {
    return {
      id: this.id,
      id_empresa: this.id_empresa,
      nombre: this.nombre,
      apellido: this.apellido,
      nombreCompleto: this.nombreCompleto,
      correo: this.correo,
      rol: this.rol,
      avatar_url: this.avatar_url,
      activo: this.activo,
      created_at: this.created_at,
    };
  }
}

