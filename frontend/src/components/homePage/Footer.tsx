import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0b1329] text-gray-400 py-12 px-6 mt-32 border-t border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* PARTE IZQUIERDA: Logotipo y descripción orientada a tu proyecto de IA */}
        <div className="max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            {/* Contenedor del icono con fondo azul claro como en tu imagen */}
            <div className="w-8 h-8 bg-secundary rounded-lg flex items-center justify-center text-white text-xs">
              <Image src="/imgs/icon_asistencIA.svg" alt="Icono Asistencia IA" width={20} height={20} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">AsistenciaAI</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Plataforma especializada en control de asistencias, rondas y verificación de identidad en tiempo real mediante visión artificial.
          </p>
        </div>

        {/* PARTE DERECHA: Enlaces del SaaS de RRHH y ChatBot (Agrega cuerpo al proyecto universitario) */}
        <div className="grid grid-cols-2 gap-12">
          {/* Columna Plataforma */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#Funciones" className="hover:text-white transition">Visión Artificial</Link></li>
              <li><Link href="#" className="hover:text-white transition">Panel de RRHH</Link></li>
              <li><Link href="#" className="hover:text-white transition">Asistente Inteligente</Link></li>
            </ul>
          </div>

          {/* Columna Universidad / Curso */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Proyecto</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">Curso: IA Avanzada</span></li>
              <li><span className="text-gray-500">SaaS Universitario</span></li>
              <li><Link href="https://github.com/Marcks1234/control-asistencia-ia" target="_blank" className="hover:text-white transition">Repositorio Git</Link></li>
            </ul>
          </div>
        </div>

      </div>

      {/* Línea divisoria inferior fina y Derechos de autor */}
      <div className="max-w-6xl mx-auto border-t border-gray-800/60 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} AsistenciaAI. Proyecto de Curso de Inteligencia Artificial.</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:underline">Términos de servicio</Link>
          <Link href="#" className="hover:underline">Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
