/**
 * Modelo de Dominio: Registro de Asistencia
 */
export class Asistencia {
  constructor({
    id,
    id_empleado,
    id_empresa,
    fecha,
    hora_entrada = null,
    hora_salida = null,
    estado = 'PUNTUAL',
    metodo_registro = 'MANUAL',
  }) {
    this.id = id;
    this.id_empleado = id_empleado;
    this.id_empresa = id_empresa;
    this.fecha = fecha;
    this.hora_entrada = hora_entrada;
    this.hora_salida = hora_salida;
    this.estado = estado; // PUNTUAL, TARDANZA, FALTA, JUSTIFICADA
    this.metodo_registro = metodo_registro; // MANUAL, FACIAL_IA, BIOMETRICO
  }

  static calcularEstado(horaMarcada, horaEsperada = '08:00', toleranciaMinutos = 15) {
    if (!horaMarcada) return 'FALTA';
    const [hM, mM] = horaMarcada.split(':').map(Number);
    const [hE, mE] = horaEsperada.split(':').map(Number);
    const minMarcada = hM * 60 + mM;
    const minEsperada = hE * 60 + mE;
    return minMarcada > minEsperada + toleranciaMinutos ? 'TARDANZA' : 'PUNTUAL';
  }

  toJSON() {
    return {
      id: this.id,
      id_empleado: this.id_empleado,
      id_empresa: this.id_empresa,
      fecha: this.fecha,
      hora_entrada: this.hora_entrada,
      hora_salida: this.hora_salida,
      estado: this.estado,
      metodo_registro: this.metodo_registro,
    };
  }
}

