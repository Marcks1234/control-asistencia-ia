import FeatureCard from "./FeatureCard"
const FEATURES_DATA = [
    {
        icon: "/imgs/icon_gestion_equipo.svg",
        icon_descripcion: "icono de gestión de equipos",
        title: "Gestión de equipos",
        description: "Organiza empleados por departamento, turno o sede desde un solo lugar.",
    },
    {
        icon: "/imgs/icon_reportes.svg",
        icon_descripcion: "icono de reportes inteligentes",
        title: "Reportes inteligentes",
        description: "Visualiza tendencias, ausencias y horas trabajadas con gráficas claras.",
    },
    {
        icon: "/imgs/icon_seguridad.svg",
        icon_descripcion: "icono de Seguro y confiable",
        title: "Seguro y confiable",
        description: "Datos cifrados, backups automáticos y cumplimiento normativo incluido.",
    },
]

export default function Features() {
    return (
        <section className="mt-20 space-y-10">
            <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-secundary" id="Funciones">Funciones</span>
            </div>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {FEATURES_DATA.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        icon={feature.icon}
                        icon_description={feature.icon_descripcion}
                        title={feature.title}
                        description={feature.description}
                    />
                ))}
            </section>
        </section>
    )
}
