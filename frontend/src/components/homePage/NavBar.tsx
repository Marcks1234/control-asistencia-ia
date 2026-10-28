import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <header className="flex justify-between items-center py-3 px-6 bg-white border border-b-gray-200">
      {/* Parte Izquierda */}
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/imgs/icon_asistencIA.svg"
          alt="Icon de Asistencia IA"
          width={40}
          height={40}
        />
        <span className="font-bold text-xl text-primary">Asistencia-IA</span>
      </Link>

      {/* Parte del centro */}
      <nav className="hidden md:flex space-x-8 text-xs font-medium text-gray-500">
        <Link className="hover:text-gray-900" href="/#Funciones">
          Funciones
        </Link>
        <Link className="hover:text-gray-900" href="/#Precios">
          Precios
        </Link>
      </nav>

      {/* Parte Derecha */}
      <div className="flex items-center">
        <Link
          href="/#login"
          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
