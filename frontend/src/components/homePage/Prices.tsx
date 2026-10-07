import PriceCard from "./PriceCard";

const PRICES_DATA = [
    {
        title: "Básico",
        price: 20,
        characteristics: [
            "Hasta 4 camaras activas",
            "Registro de hasta 50 empleados",
            "Alertas de seguridad básicas"
        ]
    },
    {
        title: "Profesional",
        price: 80,
        characteristics: [
            "Hasta 12 cámaras activas",
            "Empleados ilimitados",
            "Análisis inteligente",
            "alertas inmediatas",
            "Reportes exportables PDF"
        ],
        isPopular:true
    },
    {
        title: "Empresa",
        price: 120,
        characteristics: [
            "Cáramas ilimitadas",
            "Soporte técnico inteligente",
            "Multiples sedes",
            "Reportes Inteligentes"
        ]
    }
]


export default function Prices() {
  return (
    <section className="mt-32 space-y-16 max-w-6xl mx-auto px-2">
      {/* Encabezado centrado */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[rgb(120,141,198)] block">
          Precios
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Precios simples y transparentes
        </h2>
      </div>

      {/* Grid Responsivo para las Tarjetas */}
      {/* En celular se ve 1 columna, en tablets/PC se transforma en 3 columnas alineadas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-4">
        {PRICES_DATA.map((price, index) => (
          <PriceCard
            key={index}
            title={price.title}
            price={price.price}
            characteristics={price.characteristics}
            isPopular={price.isPopular}
          />
        ))}
      </section>
    </section>
  );
}