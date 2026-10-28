"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";

export default function RecuperarContrasenaCard() {
  const router = useRouter();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);
  const [codigoGeneradoAviso, setCodigoGeneradoAviso] = useState<string | null>(null);

  const manejarSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setExitoMensaje(null);
    setCodigoGeneradoAviso(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "No se pudo enviar el código de recuperación."
        );
      }

      setExitoMensaje(data.mensaje);
      if (data.data?.codigoVerificacion) {
        setCodigoGeneradoAviso(data.data.codigoVerificacion);
      }
      setPaso(2);
    } catch (err: any) {
      setErrorMensaje(err.message || "Error al procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  const manejarRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setExitoMensaje(null);

    if (nuevaPassword.length < 6) {
      setErrorMensaje("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMensaje("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch("/api/auth/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo,
          codigo,
          nuevaPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }

      setExitoMensaje(data.mensaje);
      setTimeout(() => {
        router.push("/#login");
      }, 1500);
    } catch (err: any) {
      setErrorMensaje(err.message || "Error al actualizar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="flex flex-col md:flex-row max-w-6xl w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* PARTE IZQUIERDA: FORMULARIO */}
      <article className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-[#f8fafc]">
        <h2 className="text-3xl font-bold text-secundary leading-tight mb-2">
          Recuperar Contraseña
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          {paso === 1
            ? "Ingresa tu correo registrado para recibir un código de verificación de 6 dígitos"
            : "Ingresa el código enviado a tu correo y define tu nueva contraseña"}
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

        {codigoGeneradoAviso && paso === 2 && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md text-xs text-gray-700">
            Código generado para tu cuenta:{" "}
            <span className="font-bold text-primary tracking-widest">
              {codigoGeneradoAviso}
            </span>
          </div>
        )}

        {paso === 1 ? (
          /* PASO 1: SOLICITAR CÓDIGO */
          <form onSubmit={manejarSolicitarCodigo} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-800">
                Correo Electrónico
              </label>
              <div className="py-1.5">
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  required
                  className="w-full pl-3 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-2 hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {cargando
                ? "Enviando código por Gmail..."
                : "Enviar Código de Recuperación"}
            </button>
          </form>
        ) : (
          /* PASO 2: INGRESAR CÓDIGO Y NUEVA CONTRASEÑA */
          <form onSubmit={manejarRestablecer} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-800">
                Código de Verificación (6 dígitos)
              </label>
              <div className="py-1.5">
                <input
                  type="text"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  required
                  className="w-full pl-3 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 tracking-widest font-bold focus:outline-hidden focus:border-secundary transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800">
                Nueva Contraseña
              </label>
              <div className="py-1.5">
                <PasswordInput
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800">
                Confirmar Nueva Contraseña
              </label>
              <div className="py-1.5">
                <PasswordInput
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-2 hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {cargando
                ? "Actualizando contraseña..."
                : "Actualizar Contraseña"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso(1);
                setErrorMensaje(null);
                setExitoMensaje(null);
              }}
              className="w-full text-xs text-gray-500 hover:underline pt-1 cursor-pointer"
            >
              Solicitar un nuevo código
            </button>
          </form>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          ¿Recordaste tu contraseña?{" "}
          <Link
            href="/#login"
            className="font-bold text-secundary hover:underline"
          >
            Regresar al inicio de sesión
          </Link>
        </p>
      </article>

      {/* PARTE DERECHA: BANNER INFORMATIVO */}
      <article className="p-8 md:p-20 bg-primary w-full md:w-1/2 flex flex-col justify-center space-y-4 text-white">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
          Seguridad y <br />
          Recuperación <br />
          Protegida
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
          Enviamos un token temporal cifrado a tu correo electrónico vía Gmail TLS SMTP para proteger la seguridad de tu empresa y colaboradores.
        </p>
      </article>
    </section>
  );
}

