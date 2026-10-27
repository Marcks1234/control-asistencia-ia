"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/homePage/NavBar";
import Footer from "@/components/homePage/Footer";

interface PlanItem {
  id: string;
  nombre: string;
  precio_mensual: string;
  limite_empleados: number | null;
  limite_camaras: number | null;
  es_recomendado?: boolean;
}

const PLANES_INICIALES: PlanItem[] = [
  {
    id: "77975779-0878-44c1-8144-b437b399d8da",
    nombre: "Básico",
    precio_mensual: "20",
    limite_empleados: 50,
    limite_camaras: 4,
    es_recomendado: false,
  },
  {
    id: "bfc2e2ca-249c-4966-8af8-f3d73b835acf",
    nombre: "Profesional",
    precio_mensual: "80",
    limite_empleados: null,
    limite_camaras: 12,
    es_recomendado: true,
  },
  {
    id: "04d22ce2-3d54-467e-8789-2870449c7602",
    nombre: "Empresa",
    precio_mensual: "120",
    limite_empleados: null,
    limite_camaras: null,
    es_recomendado: false,
  },
];

export default function RegistroPage() {
  const router = useRouter();

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [ruc, setRuc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("Lima");
  const [nombreGerente, setNombreGerente] = useState("");
  const [apellidoGerente, setApellidoGerente] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [idPlanSeleccionado, setIdPlanSeleccionado] = useState(
    PLANES_INICIALES[1].id
  );

  const [planes, setPlanes] = useState<PlanItem[]>(PLANES_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/planes")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.planes) && data.planes.length > 0) {
          setPlanes(data.planes);
          const recomendado = data.planes.find(
            (p: PlanItem) => p.es_recomendado
          );
          if (recomendado) setIdPlanSeleccionado(recomendado.id);
        }
      })
      .catch(() => {});
  }, []);

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setExitoMensaje(null);

    if (!nombreEmpresa.trim()) {
      setErrorMensaje("Ingresa el nombre de la empresa.");
      return;
    }
    if (!/^\d{11}$/.test(ruc.trim())) {
      setErrorMensaje("El RUC debe tener 11 dígitos numéricos.");
      return;
    }
    if (!nombreGerente.trim() || !apellidoGerente.trim()) {
      setErrorMensaje("Ingresa el nombre y apellido del encargado.");
      return;
    }
    if (!correo.includes("@")) {
      setErrorMensaje("Ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 6) {
      setErrorMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa,
          ruc,
          telefono,
          ciudad,
          nombreGerente,
          apellidoGerente,
          correo,
          password,
          idPlan: idPlanSeleccionado,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al procesar el registro.");
      }

      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("asistencia_jwt", data.token);
        }
        if (data.data?.usuario) {
          localStorage.setItem(
            "asistencia_usuario",
            JSON.stringify(data.data.usuario)
          );
        }
      }

      setExitoMensaje("Registro completado. Redirigiendo al panel...");
      setTimeout(() => {
        router.push("/entradas-salidas");
      }, 1200);
    } catch (err: any) {
      setErrorMensaje(err.message || "No se pudo completar el registro.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="flex flex-col md:flex-row mt-4 justify-center max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* PARTE IZQUIERDA */}
          <article className="p-8 md:p-12 w-full md:w-3/5 flex flex-col justify-center bg-[#f8fafc]">
            <h2 className="text-3xl font-bold text-secundary leading-tight mb-2">
              Registro de Empresa
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Completa los datos para crear la cuenta de encargado y activar tu
              empresa
            </p>

            {errorMensaje && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
                {errorMensaje}
              </div>
            )}

            {exitoMensaje && (
              <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
                {exitoMensaje}
              </div>
            )}

            <form onSubmit={manejarRegistro} className="space-y-4">
              {/* Fila 1: Empresa y RUC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Nombre de la Empresa
                  </label>
                  <div className="py-1.5">
                    <input
                      type="text"
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      placeholder="Ej. Inversiones SAC"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800">
                    RUC (11 dígitos)
                  </label>
                  <div className="py-1.5">
                    <input
                      type="text"
                      maxLength={11}
                      value={ruc}
                      onChange={(e) =>
                        setRuc(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="20601234567"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Ciudad y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Ciudad
                  </label>
                  <div className="py-1.5">
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Lima"
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Teléfono
                  </label>
                  <div className="py-1.5">
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="987 654 321"
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 3: Nombre y Apellido del Encargado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Nombre del Encargado
                  </label>
                  <div className="py-1.5">
                    <input
                      type="text"
                      value={nombreGerente}
                      onChange={(e) => setNombreGerente(e.target.value)}
                      placeholder="Nombre"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Apellido del Encargado
                  </label>
                  <div className="py-1.5">
                    <input
                      type="text"
                      value={apellidoGerente}
                      onChange={(e) => setApellidoGerente(e.target.value)}
                      placeholder="Apellido"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Correo y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Correo Electrónico
                  </label>
                  <div className="py-1.5">
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="correo@empresa.com"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800">
                    Contraseña
                  </label>
                  <div className="py-1.5">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      required
                      className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Selección de Plan */}
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
                          activo
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-xs font-bold">{p.nombre}</div>
                        <div
                          className={`text-xs ${
                            activo ? "text-gray-200" : "text-gray-400"
                          }`}
                        >
                          ${Number(p.precio_mensual)}/mes
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Registrar */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-2 hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {cargando ? "Registrando..." : "Crear Cuenta"}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/#login"
                className="font-bold text-secundary hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </article>

          {/* PARTE DERECHA */}
          <article className="p-8 md:p-16 bg-primary w-full md:w-2/5 flex flex-col justify-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Empieza a gestionar <br />
              la asistencia de tu <br />
              equipo en minutos.
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Registra tu empresa, configura tus sedes y lleva el control de
              entradas, salidas y tardanzas desde un solo lugar.
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
