/**
 * Modelo de Dominio: Empresa (Tenant)
 */
export class Empresa {
  constructor({
    id,
    nombre,
    ruc,
    telefono = null,
    ciudad = 'Lima',
    direccion = null,
    activo = true,
    created_at = null,
  }) {
    this.id = id;
    this.nombre = nombre?.trim();
    this.ruc = ruc?.trim();
    this.telefono = telefono;
    this.ciudad = ciudad;
    this.direccion = direccion;
    this.activo = Boolean(activo);
    this.created_at = created_at;
  }

  validarRuc() {
    return Boolean(this.ruc && /^\d{11}$/.test(this.ruc));
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      ruc: this.ruc,
      telefono: this.telefono,
      ciudad: this.ciudad,
      direccion: this.direccion,
      activo: this.activo,
      created_at: this.created_at,
    };
  }
}

