export type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  servicesCount: number;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "hogar",
    title: "Mantenimiento del hogar",
    description: "Plomería, electricidad y arreglos generales",
    icon: "🛠️",
    accent: "#F4EFFB",
    servicesCount: 24,
  },
  {
    id: "belleza",
    title: "Belleza y bienestar",
    description: "Peluquería, maquillaje, spa y más",
    icon: "💆",
    accent: "#FDF2F8",
    servicesCount: 18,
  },
  {
    id: "diseno",
    title: "Diseño y creatividad",
    description: "Branding, ilustración y fotografía",
    icon: "🎨",
    accent: "#E9F8F2",
    servicesCount: 16,
  },
  {
    id: "tecnologia",
    title: "Tecnología",
    description: "Soporte técnico, desarrollo y domótica",
    icon: "💡",
    accent: "#EEF2FF",
    servicesCount: 21,
  },
  {
    id: "eventos",
    title: "Eventos",
    description: "Organización, catering y ambientaciones",
    icon: "🎉",
    accent: "#FFF7ED",
    servicesCount: 14,
  },
  {
    id: "salud",
    title: "Salud",
    description: "Profesionales certificados para tu bienestar",
    icon: "🩺",
    accent: "#F2FBF9",
    servicesCount: 12,
  },
];
