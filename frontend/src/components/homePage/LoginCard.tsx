export default function LoginCard() {
  return (
    // Agregamos max-w-4xl, fondo blanco, bordes redondeados grandes y sombra para crear el efecto de tarjeta flotante
    <section className="flex flex-col md:flex-row mt-30 justify-center max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      
      {/* PARTE IZQUIERDA*/}
      <article className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-[#f8fafc]">
        <h2 className="text-3xl font-bold text-secundary leading-tight mb-2">
          Bienvenido <br />
          al Control de asistencia 
        </h2>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para gestionar el acceso de tus sedes.</p>
        
        <form action="" method="post" className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Correo Electrónico</label>
            <div className="py-2">
              <input 
                type="email" 
                placeholder="correo@gmail.com" 
                title="Correo electronico"
                className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500">Contraseña</label>
              <a href="#" className="text-xs text-gray-400 hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
            <div className="py-2">
              <input 
                type="password" 
                placeholder="••••••••••••" 
                className="w-full pl-2 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-hidden focus:border-secundary transition shadow-xs"
              />
            </div>
          </div>

          {/* Botón Iniciar Sesión */}
          <button className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-sm mt-1 hover:opacity-95 transition shadow-sm">
            Iniciar Sesión
          </button>
        </form>

        {/* Separador*/}
        <div className="py-3">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">O inicia con</span>
        </div>

        {/* Botones de Redes Sociales*/}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-secundary text-white py-2 px-4 rounded-md text-xs font-bold shadow-xs hover:opacity-90 transition">
            Google
          </button>
          <button className="flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-md text-xs font-bold shadow-xs hover:opacity-90 transition">
            Microsoft
          </button>
        </div>
      </article>

      {/* PARTE DERECHA*/}
      <article className="p-8 md:p-20 bg-primary w-full md:w-1/2 flex flex-col justify-center space-y-4">
        <h2 className="text-white text-3xl font-extrabold tracking-tight leading-tight">
          Control de asistencia <br />
          con reconocimiento <br />
          facial avanzado y <br />
          asistente inteligente.
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
          Compatible con cámaras IP existentes, tablets biométricas y 
          torniquetes de acceso con respuesta rápidas.
        </p>
      </article>

    </section>
  );
}
