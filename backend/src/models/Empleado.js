/**
 * Modelo de Dominio: Empleado / Colaborador
 */
export class Empleado {
  constructor({
    id,
    id_empresa,
    nombre,
    apellido,
    cargo = 'Personal',
    dni = null,
    horario_entrada = '08:00',
    horario_salida = '17:00',
    activo = true,
  }) {
    this.id = id;
    this.id_empresa = id_empresa;
    this.nombre = nombre?.trim();
    this.apellido = apellido?.trim();
    this.cargo = cargo;
    this.dni = dni;
    this.horario_entrada = horario_entrada;
    this.horario_salida = horario_salida;
    this.activo = Boolean(activo);
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  toJSON() {
    return {
      id: this.id,
      id_empresa: this.id_empresa,
      nombre: this.nombre,
      apellido: this.apellido,
      nombreCompleto: this.nombreCompleto,
      cargo: this.cargo,
      dni: this.dni,
      horario_entrada: this.horario_entrada,
      horario_salida: this.horario_salida,
      activo: this.activo,
    };
  }
}

