"use client";

import React from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useGestionPersonal } from "@/hooks/useGestionPersonal";

const inputClass = "w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white";

export default function AgregadoPruebaPage() {
  const {
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
  } = useGestionPersonal();

  return (
    <AppLayout activeItem="personal">
      {(searchQuery) => {
        const q = searchQuery.toLowerCase();
        const filtrados = empleados.filter(
          (e) => !q || `${e.nombre} ${e.apellido} ${e.dni} ${e.codigo_biometrico} ${e.departamentos?.nombre}`.toLowerCase().includes(q)
        );

        return (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestión de Personal, Departamentos y Horarios</h1>
                <p className="text-xs text-slate-500 mt-0.5">Administración de áreas, turnos y colaboradores de la empresa.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/entradas-salidas" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">Ver Asistencias</Link>
                <Link href="/asistente-ia" className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900">Abrir Asistente</Link>
              </div>
            </div>

            {mensaje && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex justify-between ${mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                <span>{mensaje.texto}</span>
                <button onClick={() => setMensaje(null)} className="cursor-pointer font-bold">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. Departamentos */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900 border-b pb-2">1. Departamentos ({departamentos.length})</h2>
                  <form onSubmit={handleCrearDepartamento} className="space-y-2 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Nombre del Área *</label>
                      <input
                        type="text"
                        required
                        value={deptoNombre}
                        onChange={(e) => setDeptoNombre(e.target.value)}
                        placeholder="Ej: Logística, Sistemas"
                        className={inputClass}
                      />
                    </div>
                    <button type="submit" disabled={guardando} className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 disabled:opacity-50">
                      Agregar Departamento
                    </button>
                  </form>
                </div>
                <div className="pt-2 border-t space-y-1.5 max-h-40 overflow-y-auto">
                  {departamentos.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-xs">
                      <span className="font-bold text-slate-800">{d.nombre}</span>
                      <button onClick={() => handleEliminarDepartamento(d.id, d.nombre)} className="text-red-600 hover:text-red-800 text-[11px] font-semibold">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Turnos */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900 border-b pb-2">2. Turnos ({turnos.length})</h2>
                  <form onSubmit={handleCrearTurno} className="space-y-2 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Nombre del Turno *</label>
                      <input type="text" required value={turnoForm.desc} onChange={(e) => setTurnoForm({ ...turnoForm, desc: e.target.value })} placeholder="Ej: Turno Tarde" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-semibold mb-1">Entrada *</label>
                        <input type="time" required value={turnoForm.entrada} onChange={(e) => setTurnoForm({ ...turnoForm, entrada: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Salida *</label>
                        <input type="time" required value={turnoForm.salida} onChange={(e) => setTurnoForm({ ...turnoForm, salida: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Tol. (min)</label>
                        <input type="number" min="0" max="60" value={turnoForm.tol} onChange={(e) => setTurnoForm({ ...turnoForm, tol: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                    <button type="submit" disabled={guardando} className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 disabled:opacity-50">Guardar Turno</button>
                  </form>
                </div>
                <div className="pt-2 border-t space-y-1.5 max-h-40 overflow-y-auto">
                  {turnos.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{t.descripcion}</span>
                        <span className="text-slate-500 ml-1.5">{t.hora_entrada.slice(0, 5)} - {t.hora_salida.slice(0, 5)}</span>
                      </div>
                      <button onClick={() => handleEliminarTurno(t.id, t.descripcion)} className="text-red-600 hover:text-red-800 text-[11px] font-semibold">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Registrar Empleado */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 border-b pb-2">3. Registrar Colaborador</h2>
                <form onSubmit={handleCrearEmpleado} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Nombre *</label>
                      <input type="text" required value={empForm.nombre} onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })} placeholder="Ej: Marcos" className={inputClass} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Apellido *</label>
                      <input type="text" required value={empForm.apellido} onChange={(e) => setEmpForm({ ...empForm, apellido: e.target.value })} placeholder="Ej: Peralta" className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">DNI *</label>
                      <input type="text" required value={empForm.dni} onChange={(e) => setEmpForm({ ...empForm, dni: e.target.value })} placeholder="Ej: 72849102" className={inputClass} />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Cargo</label>
                      <input type="text" value={empForm.cargo} onChange={(e) => setEmpForm({ ...empForm, cargo: e.target.value })} placeholder="Ej: Desarrollador" className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Departamento</label>
                      <select value={empForm.idDepto} onChange={(e) => setEmpForm({ ...empForm, idDepto: e.target.value })} className={inputClass}>
                        {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Turno *</label>
                      <select value={empForm.idTurno} onChange={(e) => setEmpForm({ ...empForm, idTurno: e.target.value })} className={inputClass}>
                        {turnos.map((t) => <option key={t.id} value={t.id}>{t.descripcion} ({t.hora_entrada.slice(0, 5)} - {t.hora_salida.slice(0, 5)})</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={guardando} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">Guardar Colaborador</button>
                </form>
              </div>
            </div>

            {/* Tabla de Empleados */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold text-slate-900">4. Colaboradores ({filtrados.length})</h2>
                <button onClick={cargarDatos} disabled={cargando} className="text-xs text-blue-600 font-semibold hover:underline">
                  {cargando ? "Cargando..." : "Refrescar"}
                </button>
              </div>
              {filtrados.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No hay colaboradores registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase text-[10px]">
                        <th className="py-2 px-2">Colaborador</th>
                        <th className="py-2 px-2">DNI</th>
                        <th className="py-2 px-2">Cód. Biométrico</th>
                        <th className="py-2 px-2">Departamento</th>
                        <th className="py-2 px-2">Turno Asignado</th>
                        <th className="py-2 px-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtrados.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-bold text-slate-800">
                            {emp.nombre} {emp.apellido}
                            <span className="block text-[11px] font-normal text-slate-400">{emp.cargo}</span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">{emp.dni}</td>
                          <td className="py-2.5 px-2 font-mono font-semibold text-blue-600">{emp.codigo_biometrico}</td>
                          <td className="py-2.5 px-2">
                            <select
                              value={emp.departamentos?.nombre ? departamentos.find(d => d.nombre === emp.departamentos?.nombre)?.id || emp.id_departamento || "" : emp.id_departamento || ""}
                              onChange={(e) => handleCambioDepartamento(emp.id, e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                            >
                              <option value="">Sin área</option>
                              {departamentos.map((d) => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-2">
                            <select
                              value={emp.horarios?.id || emp.id_horario || ""}
                              onChange={(e) => handleCambioTurno(emp.id, e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                            >
                              <option value="">Sin turno</option>
                              {turnos.map((t) => (
                                <option key={t.id} value={t.id}>{t.descripcion} ({t.hora_entrada.slice(0, 5)} - {t.hora_salida.slice(0, 5)})</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button onClick={() => handleEliminarEmpleado(emp.id, `${emp.nombre} ${emp.apellido}`)} className="text-red-600 hover:text-red-800 font-semibold text-xs">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </AppLayout>
  );
}
