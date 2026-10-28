/**
 * Modelo de Dominio: Plan Comercial y Suscripción
 */
export class Plan {
  constructor({
    id,
    nombre,
    limite_empleados = 20,
    limite_camaras = 2,
    precio_mensual = 0,
    caracteristicas = [],
    es_recomendado = false,
    activo = true,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.limite_empleados = limite_empleados;
    this.limite_camaras = limite_camaras;
    this.precio_mensual = Number(precio_mensual);
    this.caracteristicas = Array.isArray(caracteristicas) ? caracteristicas : [];
    this.es_recomendado = Boolean(es_recomendado);
    this.activo = Boolean(activo);
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      limite_empleados: this.limite_empleados,
      limite_camaras: this.limite_camaras,
      precio_mensual: this.precio_mensual,
      caracteristicas: this.caracteristicas,
      es_recomendado: this.es_recomendado,
      activo: this.activo,
    };
  }
}

