
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
                <Link href="/reportes" className="text-gray-600 hover:text-gray-900 transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Iniciar sesión</Link>
                <Link href="/reportes" className="btn-home-page-secundary inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Empezar Gratis</Link>
            </div>
        </header>

    )
}