"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  const router = useRouter();
  const [correo, setCorreo] = useState("admin@gmail.com");
  const [password, setPassword] = useState("123456789");
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Credenciales incorrectas.");
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

      router.push("/entradas-salidas");
    } catch (err: any) {
      setErrorMensaje(err.message || "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      id="login"
      className="flex flex-col md:flex-row mt-30 justify-center max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
    >
      {/* PARTE IZQUIERDA */}
      <article className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-[#f8fafc]">
        <h2 className="text-3xl font-bold text-secundary leading-tight mb-2">
          Bienvenido al <br /> Control de Asistencia IA
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>

        {errorMensaje && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
            {errorMensaje}
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-800">
                Contraseña
              </label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs text-gray-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-2 hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {cargando ? "Validando sesión JWT..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Separador "o continúa con" */}
        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs">
            o continúa con
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Botones Sociales */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={manejarLogin}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={manejarLogin}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 21 21">
              <path fill="#f25022" d="M1 1h9v9H1z" />
              <path fill="#00a4ef" d="M1 11h9v9H1z" />
              <path fill="#7fba00" d="M11 1h9v9h-9z" />
              <path fill="#ffb900" d="M11 11h9v9h-9z" />
            </svg>
            Microsoft
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/registro"
            className="font-bold text-secundary hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </article>

      {/* PARTE DERECHA */}
      <article className="p-8 md:p-20 bg-primary w-full md:w-1/2 flex flex-col justify-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
          Control de asistencia <br />
          con reconocimiento <br />
          facial avanzado y <br />
          fácil de usar.
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
          Compatible con cualquier dispositivo con cámara: tablets, celulares o
          computadoras.
        </p>
      </article>
    </section>
  );
}
