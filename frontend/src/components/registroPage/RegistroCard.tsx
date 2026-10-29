"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";
import { Plan } from "@/models";

const PLANES_INICIALES: Plan[] = [
  { id: "77975779-0878-44c1-8144-b437b399d8da", nombre: "Básico", precio_mensual: 20, limite_empleados: 50, limite_camaras: 4, caracteristicas: [] },
  { id: "bfc2e2ca-249c-4966-8af8-f3d73b835acf", nombre: "Profesional", precio_mensual: 80, limite_empleados: null, limite_camaras: 12, caracteristicas: [], es_recomendado: true },
  { id: "04d22ce2-3d54-467e-8789-2870449c7602", nombre: "Empresa", precio_mensual: 120, limite_empleados: null, limite_camaras: null, caracteristicas: [] },
];

export default function RegistroCard() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombreEmpresa: "",
    ruc: "",
    telefono: "",
    ciudad: "Lima",
    nombreGerente: "",
    apellidoGerente: "",
    correo: "",
    password: "",
  });

  const [idPlanSeleccionado, setIdPlanSeleccionado] = useState(PLANES_INICIALES[1].id);
  const [planes, setPlanes] = useState<Plan[]>(PLANES_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/planes")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.planes) && data.planes.length > 0) {
          setPlanes(data.planes);
          const recomendado = data.planes.find((p: Plan) => p.es_recomendado);
          if (recomendado) setIdPlanSeleccionado(recomendado.id);
        }
      })
      .catch(() => {});
  }, []);

  const actualizarCampo = (campo: keyof typeof form, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setExitoMensaje(null);

    if (!form.nombreEmpresa.trim()) return setErrorMensaje("Ingresa el nombre de la empresa.");
    if (!/^\d{11}$/.test(form.ruc.trim())) return setErrorMensaje("El RUC debe tener 11 dígitos numéricos.");
    if (!form.nombreGerente.trim() || !form.apellidoGerente.trim()) return setErrorMensaje("Ingresa nombre y apellido del encargado.");
    if (!form.correo.includes("@")) return setErrorMensaje("Ingresa un correo electrónico válido.");
    if (form.password.length < 6) return setErrorMensaje("La contraseña debe tener al menos 6 caracteres.");

    setCargando(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, idPlan: idPlanSeleccionado }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al procesar el registro.");

      if (typeof window !== "undefined") {
        if (data.token) localStorage.setItem("asistencia_jwt", data.token);
        if (data.data?.usuario) localStorage.setItem("asistencia_usuario", JSON.stringify(data.data.usuario));
      }

      setExitoMensaje("Registro completado. Redirigiendo al panel...");
      setTimeout(() => router.push("/entradas-salidas"), 1200);
    } catch (err: any) {
      setErrorMensaje(err.message || "No se pudo completar el registro.");
    } finally {
      setCargando(false);
    }
  };

  const inputClass = "w-full pl-3 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs";

  return (
    <section className="flex flex-col lg:flex-row max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* LATERAL INFORMATIVO */}
      <article className="p-8 lg:p-12 bg-primary text-white lg:w-5/12 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[rgb(120,141,198)] bg-white/10 px-3 py-1 rounded-full inline-block mb-6">
            Empieza Hoy
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Digitaliza el control de asistencia de tu empresa
          </h2>
          <p className="text-xs text-gray-300 mt-4 leading-relaxed">
            Regístrate en menos de 2 minutos y obtén acceso al control de asistencia, reportes en tiempo real y asistente para tu empresa.
          </p>
          <ul className="mt-8 space-y-3.5 text-xs text-gray-200">
            {["Prueba gratuita sin tarjeta de crédito", "Detección de tardanzas automática con tolerancia", "Asistente de consultas integrado"].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/#login" className="text-white font-bold hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </article>

      {/* FORMULARIO DE REGISTRO */}
      <article className="p-8 lg:p-12 lg:w-7/12 flex flex-col justify-center bg-[#f8fafc]">
        <h3 className="text-2xl font-bold text-secundary">Crear Cuenta Empresarial</h3>
        <p className="text-xs text-gray-400 mb-6 mt-1">Completa los datos de tu empresa y el encargado de Recursos Humanos</p>

        {errorMensaje && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{errorMensaje}</div>}
        {exitoMensaje && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">{exitoMensaje}</div>}

        <form onSubmit={manejarRegistro} className="space-y-4">
          {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
          <div className="border-b border-gray-200/80 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Datos de la Empresa</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs font-bold text-gray-800">Nombre de la Empresa</label>
                <div className="py-1">
                  <input type="text" value={form.nombreEmpresa} onChange={(e) => actualizarCampo("nombreEmpresa", e.target.value)} placeholder="Ej. Inversiones Alfa SAC" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">RUC</label>
                <div className="py-1">
                  <input type="text" maxLength={11} value={form.ruc} onChange={(e) => actualizarCampo("ruc", e.target.value.replace(/\D/g, ""))} placeholder="11 dígitos (Ej. 20601234567)" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Teléfono / Celular</label>
                <div className="py-1">
                  <input type="tel" value={form.telefono} onChange={(e) => actualizarCampo("telefono", e.target.value)} placeholder="+51 987 654 321" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Ciudad</label>
                <div className="py-1">
                  <input type="text" value={form.ciudad} onChange={(e) => actualizarCampo("ciudad", e.target.value)} placeholder="Lima" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DEL ENCARGADO / GERENTE */}
          <div className="border-b border-gray-200/80 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Datos del Encargado (Gerente / RRHH)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs font-bold text-gray-800">Nombre</label>
                <div className="py-1">
                  <input type="text" value={form.nombreGerente} onChange={(e) => actualizarCampo("nombreGerente", e.target.value)} placeholder="Ej. Juan" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Apellido</label>
                <div className="py-1">
                  <input type="text" value={form.apellidoGerente} onChange={(e) => actualizarCampo("apellidoGerente", e.target.value)} placeholder="Ej. Pérez" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Correo Electrónico</label>
                <div className="py-1">
                  <input type="email" value={form.correo} onChange={(e) => actualizarCampo("correo", e.target.value)} placeholder="juan.perez@empresa.com" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-800">Contraseña</label>
                <div className="py-1">
                  <PasswordInput value={form.password} onChange={(e) => actualizarCampo("password", e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} autoComplete="new-password" />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SELECCIÓN DE PLAN (EN SOLES) */}
          <div>
            <label className="text-xs font-bold text-gray-800">Plan</label>
            <div className="grid grid-cols-3 gap-3 py-1.5">
              {planes.map((p) => {
                const activo = idPlanSeleccionado === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIdPlanSeleccionado(p.id)}
                    className={`py-2 px-3 rounded-md border text-left transition cursor-pointer ${
                      activo ? "bg-primary text-white border-primary shadow-xs" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-xs font-bold">{p.nombre}</div>
                    <div className={`text-xs ${activo ? "text-gray-200" : "text-gray-400"}`}>S/ {Number(p.precio_mensual)}/mes</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTÓN REGISTRAR */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 px-4 rounded-md text-white font-bold bg-primary hover:bg-secundary transition shadow-md disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer mt-4"
          >
            {cargando ? "Registrando empresa..." : "Completar Registro y Empezar Prueba"}
          </button>
        </form>
      </article>
    </section>
  );
}
