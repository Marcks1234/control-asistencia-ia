import Features from "@/components/homePage/Features";
import LoginCard from "@/components/homePage/LoginCard";
import Prices from "@/components/homePage/Prices";
import Footer from "@/components/homePage/Footer";
import NavBar from "@/components/homePage/NavBar";
export default function MainPage() {
  return (
    <>
      <NavBar/>
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="mt-8 text-center max-w-3xl mx-auto space-y-3">
          {/* Titulo grande*/}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Control de asistencia{" "}
            <span className="block text-secundary">
              Sin complicaciones
            </span>
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            Registra entradas, salidas y ausencias de tu equipo en tiempo real mediante<br />
            reconocimiento facial con IA
          </p>
          <p className="text-md text-gray-500 mt-2">
            Sin hoja de cálculo, sin errores, sin excusas.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <button className="btn-home-page-primary">Probar gratis 14 Dias</button>
            <button className="btn-home-page-secundary">Ver Precios</button>
          </div>
        </section>
          <Features/>
          <LoginCard/>
          <Prices/>
      </main>
        <Footer/>
    </>
  )
}
