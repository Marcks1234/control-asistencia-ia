
"use client";

import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Camera,
  LogIn,
  ClipboardList,
  Bot,
  Bell,
  Settings,
  Search,
  Download,
  CalendarDays,
  Menu,
  X,
  Clock3,
  ShieldCheck,
} from "lucide-react";

const menu = [
  { nombre: "Dashboard", icono: LayoutDashboard, activo: true },
  { nombre: "Personal", icono: Users, activo: false },
  { nombre: "Cámaras IA", icono: Camera, activo: false },
  { nombre: "Entradas / Salidas", icono: LogIn, activo: false },
  { nombre: "Reportes", icono: ClipboardList, activo: false },
  { nombre: "Asistente IA", icono: Bot, activo: false },
];

const actividades = [
  { nombre: "J. Medina", cargo: "TI Lead", hora: "07:00 AM", area: "TI", inicial: "JM" },
  { nombre: "Rostova", cargo: "Ventas Senior", hora: "07:05 AM", area: "Ventas", inicial: "RO" },
  { nombre: "A. Soto", cargo: "Talento", hora: "07:18 AM", area: "RRHH", inicial: "AS" },
  { nombre: "H. García", cargo: "Logística", hora: "08:34 AM", area: "Operaciones", inicial: "HG" },
  { nombre: "I. Gómez", cargo: "Despacho", hora: "09:12 AM", area: "Operaciones", inicial: "IG" },
];

export default function DashboardPage() {
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const filtradas = useMemo(
    () =>
      actividades.filter((persona) =>
        `${persona.nombre} ${persona.area} ${persona.cargo}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      ),
    [busqueda]
  );

  function exportarCSV() {
    const filas = [
      "Colaborador;Hora;Departamento",
      ...filtradas.map(
        (p) => `${p.nombre};${p.hora};${p.area}`
      ),
    ];

    const archivo = new Blob(
      ["\uFEFF" + filas.join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "asistencias-demo.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#18243D] lg:flex">

      {/* Fondo del menú en móviles */}
      {menuAbierto && (
        <button
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Cerrar menú"
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-100 bg-white px-4 py-6 transition-transform lg:static lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                AsistenciaAI
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                CONTROL & ASISTENCIA
              </p>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Navegación principal
        </p>

        <nav className="space-y-1">
          {menu.map(({ nombre, icono: Icono, activo }) => (
            activo ? (
              <a
                key={nombre}
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg bg-[#17223D] px-3 py-3 text-sm font-semibold text-white"
              >
                <Icono size={17} />
                {nombre}
              </a>
            ) : (
              <div
                key={nombre}
                title="Módulo pendiente de implementar"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500"
              >
                <Icono size={17} />
                {nombre}
              </div>
            )
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-500">
            <span className="flex items-center gap-3">
              <Bell size={17} />
              Alertas
            </span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-500">
              3
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-500">
            <Settings size={17} />
            Configuración
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              AD
            </div>
            <div>
              <p className="text-sm font-bold">Administrador</p>
              <p className="text-xs text-slate-400">Cuenta de prueba</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="min-w-0 flex-1">
        {/* BARRA SUPERIOR */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              className="lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={23} />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <CalendarDays size={16} />
              Lunes, 07 de septiembre de 2026
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar empleado..."
                className="w-40 bg-transparent text-xs text-slate-700 outline-none sm:w-52"
              />
            </div>

            <button
              disabled
              title="Asistente IA pendiente de implementar"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white opacity-70"
            >
              <Bot size={16} />
              Asistente IA
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-5 lg:p-9">
          {/* TÍTULO */}
          <div className="mb-7 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Resumen general de control de asistencia
              </p>
            </div>

            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Download size={16} />
              Exportar
            </button>
          </div>

          {/* TARJETAS DE ESTADÍSTICAS */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Presentes hoy
                </p>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-extrabold">38</span>
                <span className="mb-1 text-sm text-slate-400">/ 45</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-emerald-500">
                84% de asistencia
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Tardanzas
                </p>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-amber-500">
                  1
                </span>
                <span className="mb-1 text-sm text-slate-400">
                  colaborador
                </span>
              </div>
              <p className="mt-2 text-sm text-amber-500">
                +34 min de tolerancia
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Ausentes
                </p>
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-red-500">
                  6
                </span>
                <span className="mb-1 text-sm text-slate-400">
                  colaboradores
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Permisos y faltas justificadas
              </p>
            </div>
          </div>

          {/* ACTIVIDADES Y ESTADÍSTICAS LATERALES */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">

            {/* TABLA DE ACTIVIDADES */}
            <section className="rounded-2xl border border-slate-100 bg-white p-6 xl:col-span-2">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">
                    Actividades de hoy
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Registros de asistencia y marcación
                  </p>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Demostración
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="pb-4">Colaborador</th>
                      <th className="pb-4">Hora</th>
                      <th className="pb-4">Departamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((persona) => (
                      <tr
                        key={persona.nombre}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                              {persona.inicial}
                            </div>
                            <div>
                              <p className="text-sm font-bold">
                                {persona.nombre}
                              </p>
                              <p className="text-xs text-slate-400">
                                {persona.cargo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm font-medium text-slate-600">
                          {persona.hora}
                        </td>
                        <td className="text-sm text-slate-500">
                          {persona.area}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtradas.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No se encontraron colaboradores.
                  </p>
                )}
              </div>
            </section>

            {/* PANEL DERECHO */}
            <div className="space-y-6">

              <section className="rounded-2xl border border-slate-100 bg-white p-6">
                <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-600">
                  Turno actual
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">
                    Turno Mañana
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                    ACTIVO
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Clock3 size={14} />
                  07:00 AM — 03:00 PM · 38 asignados
                </p>

                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[65%] rounded-full bg-blue-600" />
                </div>
                <p className="mt-3 text-right text-xs text-slate-400">
                  65% de avance de ejemplo
                </p>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6">
                <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-600">
                  Puntualidad semanal
                </h3>
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-extrabold">
                    94.2%
                  </span>
                  <span className="mb-1 text-xs font-semibold text-emerald-500">
                    +1.8% vs semana pasada
                  </span>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-400">
                  Promedio de 36 colaboradores activos esta semana.
                </p>
              </section>

            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Vista demostrativa: los indicadores y registros todavía no
            están conectados con la base de datos.
          </p>
        </main>
      </div>
    </div>
  );
}
