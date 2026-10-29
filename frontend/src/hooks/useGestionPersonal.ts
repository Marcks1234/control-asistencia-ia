"use client";

import { useState, useEffect } from "react";
import {
  fetchEmpleadosPrueba,
  crearEmpleadoPrueba,
  asignarTurnoEmpleado,
  eliminarEmpleadoPrueba,
  crearTurnoPrueba,
  eliminarTurnoPrueba,
  crearDepartamentoPrueba,
  eliminarDepartamentoPrueba,
  EmpleadoItem,
  DepartamentoOption,
  TurnoOption,
} from "@/services/empleadoService";

export function useGestionPersonal() {
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [turnos, setTurnos] = useState<TurnoOption[]>([]);
  const [cargando, setCargando] = useState(true);

  const [empForm, setEmpForm] = useState({ nombre: "", apellido: "", dni: "", cargo: "", idDepto: "", idTurno: "" });
  const [turnoForm, setTurnoForm] = useState({ desc: "", entrada: "08:00", salida: "17:00", tol: "10" });
  const [deptoNombre, setDeptoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    const data = await fetchEmpleadosPrueba();
    if (data.ok) {
      setEmpleados(data.empleados);
      setDepartamentos(data.departamentos);
      setTurnos(data.turnos);
      setEmpForm((prev) => ({
        ...prev,
        idDepto: prev.idDepto || data.departamentos[0]?.id || "",
        idTurno: prev.idTurno || data.turnos[0]?.id || "",
      }));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (!empForm.nombre.trim() || !empForm.apellido.trim() || !empForm.dni.trim()) {
      return setMensaje({ tipo: "err", texto: "Completa nombre, apellido y DNI." });
    }
    setGuardando(true);
    const res = await crearEmpleadoPrueba({
      nombre: empForm.nombre.trim(),
      apellido: empForm.apellido.trim(),
      dni: empForm.dni.trim(),
      cargo: empForm.cargo.trim() || "Colaborador",
      id_departamento: empForm.idDepto || undefined,
      id_horario: empForm.idTurno || undefined,
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: res.mensaje || "Empleado registrado." });
      setEmpForm((p) => ({ ...p, nombre: "", apellido: "", dni: "", cargo: "" }));
      cargarDatos();
    } else {
      setMensaje({ tipo: "err", texto: res.error || "Error al registrar." });
    }
  };

  const handleCrearTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (!turnoForm.desc.trim()) return setMensaje({ tipo: "err", texto: "Ingresa la descripción del turno." });
    setGuardando(true);
    const res = await crearTurnoPrueba({
      descripcion: turnoForm.desc.trim(),
      hora_entrada: turnoForm.entrada,
      hora_salida: turnoForm.salida,
      tolerancia_minutos: Number(turnoForm.tol) || 10,
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: res.mensaje || "Turno creado." });
      setTurnoForm((p) => ({ ...p, desc: "" }));
      cargarDatos();
    } else {
      setMensaje({ tipo: "err", texto: res.error || "Error al crear turno." });
    }
  };

  const handleCrearDepartamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (!deptoNombre.trim()) return setMensaje({ tipo: "err", texto: "Ingresa el nombre del departamento." });
    setGuardando(true);
    const res = await crearDepartamentoPrueba(deptoNombre.trim());
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: res.mensaje || "Departamento creado." });
      setDeptoNombre("");
      cargarDatos();
    } else {
      setMensaje({ tipo: "err", texto: res.error || "Error al crear departamento." });
    }
  };

  const handleEliminarEmpleado = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    const res = await eliminarEmpleadoPrueba(id);
    if (res.ok) cargarDatos();
    else setMensaje({ tipo: "err", texto: res.error || "Error al eliminar." });
  };

  const handleEliminarTurno = async (id: string, desc: string) => {
    if (!confirm(`¿Eliminar turno "${desc}"? Los empleados asignados quedarán sin turno.`)) return;
    const res = await eliminarTurnoPrueba(id);
    if (res.ok) cargarDatos();
    else setMensaje({ tipo: "err", texto: res.error || "Error al eliminar." });
  };

  const handleEliminarDepartamento = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar departamento "${nombre}"? Los empleados asignados quedarán sin departamento.`)) return;
    const res = await eliminarDepartamentoPrueba(id);
    if (res.ok) cargarDatos();
    else setMensaje({ tipo: "err", texto: res.error || "Error al eliminar." });
  };

  const handleCambioTurno = async (idEmpleado: string, idHorario: string) => {
    await asignarTurnoEmpleado(idEmpleado, idHorario || null, undefined);
    cargarDatos();
  };

  const handleCambioDepartamento = async (idEmpleado: string, idDepartamento: string) => {
    await asignarTurnoEmpleado(idEmpleado, undefined, idDepartamento || null);
    cargarDatos();
  };

  return {
    empleados,
    departamentos,
    turnos,
    cargando,
    guardando,
    mensaje,
    setMensaje,
    empForm,
    setEmpForm,
    turnoForm,
    setTurnoForm,
    deptoNombre,
    setDeptoNombre,
    cargarDatos,
    handleCrearEmpleado,
    handleCrearTurno,
    handleCrearDepartamento,
    handleEliminarEmpleado,
    handleEliminarTurno,
    handleEliminarDepartamento,
    handleCambioTurno,
    handleCambioDepartamento,
  };
}
