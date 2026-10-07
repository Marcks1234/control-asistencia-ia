import Image from "next/image"
interface FeatureCardProps {
    icon: string,
    icon_description: string,
    title: string,
    description: string
}

export default function FeatureCard({ icon, icon_description, title, description }: FeatureCardProps) {
    return (
        <article className="bg-[rgba(120,141,198,0.07)] border border-[rgba(120,141,198,0.15)] rounded-2xl p-8 flex flex-col space-y-4 min-h-[200px] hover:scale-107 transition-all">
            <div className="">
                <Image src={icon} alt={icon_description} width={40} height={40}></Image>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </article>
    )
}