interface PriceCardProps {
    title: String,
    price: number,
    characteristics: string[],
    isPopular?: boolean
}

export default function PriceCard({ title, price, characteristics, isPopular = false }: PriceCardProps) {
  return (
    <article 
      className={`relative rounded-3xl p-8 flex flex-col justify-between shadow-xl border transition-all duration-300 min-h-[450px]
        ${isPopular 
          ? "bg-primary text-white border-primary scale-105 z-10 md:-translate-y-4 hover:scale-110" 
          : "bg-white text-gray-900 border-gray-100 hover:scale-102"
        }`}
    >
      {/* Badge de "RECOMENDADO" en la parte superior central */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secundary text-white text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Recomendado
        </div>
      )}

      {/* Contenido Superior: Título y Precio */}
      <div className="space-y-4 text-center mt-2">
        <h3 className={`text-xl font-bold ${isPopular ? "text-white" : "text-gray-900"}`}>
          {title}
        </h3>
        
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-extrabold tracking-tight">$</span>
          <span className="text-5xl font-black tracking-tight">{price}</span>
          <span className={`text-xs font-semibold ${isPopular ? "text-gray-300" : "text-gray-400"}`}>
            /mes
          </span>
        </div>
      </div>

      {/* Lista de Características */}
      <ul className="space-y-3.5 my-8 text-left flex-grow pl-2">
        {characteristics.map((value, idx) => (
          // ¡Aquí solucionamos el error! Agregamos la propiedad key={idx} al li
          <li key={idx} className="flex items-start gap-2.5 text-sm leading-tight">
            <span className={isPopular ? "text-secundary" : "text-gray-400"}>•</span>
            <span className={isPopular ? "text-gray-200" : "text-gray-600"}>
              {value}
            </span>
          </li>
        ))}
      </ul>

      {/* Botón de Acción Inferior */}
      <button 
        className={`w-full py-3 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-98
          ${isPopular 
            ? "bg-white text-primary hover:bg-gray-50" 
            : "bg-primary text-white hover:opacity-95"
          }`}
      >
        {isPopular ? "Contratar plan" : "Empezar Ahora"}
      </button>
    </article>
  );
}