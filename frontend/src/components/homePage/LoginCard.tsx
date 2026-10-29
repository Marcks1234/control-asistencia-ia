"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginCard() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const manejarLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

      if (data.token) {
        localStorage.setItem("asistencia_jwt", data.token);
      }

      if (data.data?.usuario) {
        localStorage.setItem(
          "asistencia_usuario",
          JSON.stringify(data.data.usuario)
        );
      }

      router.push("/reportes");
    } catch (err: unknown) {
      setErrorMensaje(
        err instanceof Error ? err.message : "Error al iniciar sesión."
      );
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
          <div
            role="alert"
            className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600"
          >
            {errorMensaje}
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label
              htmlFor="correo"
              className="text-xs font-bold text-gray-800"
            >
              Correo Electrónico
            </label>

            <div className="py-1.5">
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@empresa.com"
                autoComplete="username"
                required
                className="w-full pl-3 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
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
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-2 hover:opacity-90 enabled:active:scale-98 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

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