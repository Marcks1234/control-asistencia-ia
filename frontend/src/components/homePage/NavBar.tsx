
import Link from "next/link"
import Image from "next/image"

export default function NavBar() {
    return (
        <header className="flex justify-between items-center py-3 px-6  bg-white border border-b-gray-200" >
            {/* imagen */}
            <div className="flex items-center gap-2">
                <Image src="/imgs/icon_asistencIA.svg" alt="Icon de Asistencia IA" width={40} height={40} />
                <span className="font-bold text-xl text-primary">Asistencia-IA</span>
            </div>

            {/* navegación */}
            <nav className="flex gap-6">
                <Link className="text-gray-600 hover:text-gray-900 transition" href="#Funciones">Funciones</Link>
                <Link className="text-gray-600 hover:text-gray-900 transition" href="">Precios</Link>
            </nav>

            {/*botones iniciar*/}
            <div className="flex items-center gap-4">
                <button className="text-gray-600 hover:text-gray-900 transition">Iniciar sesión</button>
                <button className="btn-home-page-secundary">Empezar Gratis</button>
            </div>
        </header>

    )
}