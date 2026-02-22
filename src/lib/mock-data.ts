
export interface AgriculturalDocument {
  id: string;
  title: string;
  type: 'Convenio' | 'Proyecto' | 'Informe' | 'Otro';
  project: string;
  date: string;
  authors: string[];
  keywords: string[];
  content: string;
  imageUrl: string;
}

export const MOCK_DOCUMENTS: AgriculturalDocument[] = [
  {
    id: '1',
    title: 'Convenio de Cooperación Técnica: Gestión de Suelos 2024',
    type: 'Convenio',
    project: 'Sustentabilidad Agraria',
    date: '2024-01-15',
    authors: ['Dr. Mario Rojas', 'Dra. Elena Gómez'],
    keywords: ['Suelo', 'Fertilidad', 'Convenio'],
    content: 'Este documento establece las bases para la cooperación técnica en la mejora de la fertilidad de los suelos en la región andina. El objetivo principal es reducir el uso de químicos mediante bio-fertilizantes.',
    imageUrl: 'https://picsum.photos/seed/agri1/600/400'
  },
  {
    id: '2',
    title: 'Informe de Avance: Riego por Goteo en Zonas Áridas',
    type: 'Informe',
    project: 'Agua para Todos',
    date: '2024-02-10',
    authors: ['Ing. Carlos Páez'],
    keywords: ['Riego', 'Goteo', 'Recursos Hídricos'],
    content: 'Se reportan avances significativos en la implementación de sistemas de riego por goteo automatizados. Se ha logrado una eficiencia del 95% en el uso del recurso hídrico.',
    imageUrl: 'https://picsum.photos/seed/agri2/600/400'
  },
  {
    id: '3',
    title: 'Proyecto de Extensión Rural: Huertas Comunitarias',
    type: 'Proyecto',
    project: 'Soberanía Alimentaria',
    date: '2023-11-05',
    authors: ['Lic. Rosa Martínez', 'Prof. Juan Pérez'],
    keywords: ['Comunidad', 'Huertas', 'Capacitación'],
    content: 'Plan integral para el desarrollo de 50 huertas comunitarias en el sector rural norte. Incluye módulos de capacitación en agricultura orgánica y comercialización local.',
    imageUrl: 'https://picsum.photos/seed/agri3/600/400'
  }
];
