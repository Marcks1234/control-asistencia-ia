"use client";

import { useState, useEffect } from "react";
import { Usuario } from "@/models/Usuario";

export interface AuthUserInfo {
  id?: string;
  id_empresa?: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  iniciales: string;
  correo?: string;
  rol: string;
}

export function useAuthUser(): AuthUserInfo {
  const [usuario, setUsuario] = useState<AuthUserInfo>({
    nombre: "",
    apellido: "",
    nombreCompleto: "Usuario",
    iniciales: "U",
    rol: "Gerente RRHH",
  });

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("asistencia_usuario");
      if (guardado) {
        const p: Partial<Usuario> = JSON.parse(guardado);
        if (p?.nombre) {
          const nombre = p.nombre;
          const apellido = p.apellido || "";
          setUsuario({
            id: p.id,
            id_empresa: p.id_empresa,
            nombre,
            apellido,
            nombreCompleto: `${nombre} ${apellido}`.trim(),
            iniciales: `${nombre[0] || "U"}${apellido[0] || ""}`.toUpperCase(),
            correo: p.correo,
            rol: p.rol === "GERENTE" ? "Gerente RRHH" : p.rol || "Gerente RRHH",
          });
        }
      }
    } catch {}
  }, []);

  return usuario;
}

