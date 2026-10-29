import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header className="flex justify-between items-center py-3 px-6 bg-white border border-b-gray-200">
      {/* Logotipo */}
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/imgs/icon_asistencIA.svg"
          alt="Asistencia IA"
          width={40}
          height={40}
        />
        <span className="font-bold text-xl text-primary">
          Asistencia-IA
        </span>
      </Link>

      {/* Navegación */}
      <nav
        aria-label="Navegación principal"
        className="hidden md:flex space-x-8 text-xs font-medium text-gray-500"
      >
        <Link
          href="/#Funciones"
          className="hover:text-gray-900 transition"
        >
          Funciones
        </Link>
        <Link
          href="/#Precios"
          className="hover:text-gray-900 transition"
        >
          Precios
        </Link>
      </nav>

      {/* Acceso */}
      <div className="flex items-center gap-3">
        <Link
          href="/#login"
          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Iniciar sesión
        </Link>

        <Link
          href="/registro"
          className="btn-home-page-secundary inline-flex items-center justify-center text-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Empezar Gratis
        </Link>
      </div>
    </header>
  );
}