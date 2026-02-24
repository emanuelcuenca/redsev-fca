
export interface AgriculturalDocument {
  id: string;
  title: string;
  type: 'Convenio' | 'Proyecto' | 'Movilidad' | 'Pasantía' | 'Resolución' | 'Reglamento' | 'Otro';
  project: string;
  date: string;
  authors: string[];
  keywords: string[];
  content: string;
  imageUrl: string;
  // Campos específicos para Convenios
  isVigente?: boolean;
  signingYear?: number;
  counterpart?: string;
  convenioSubType?: 'Marco' | 'Específico' | 'Pasantía';
  uploadDate: string;
}

export const MOCK_DOCUMENTS: AgriculturalDocument[] = [
  {
    id: '1',
    title: 'Convenio de Cooperación Técnica: Gestión de Suelos 2024',
    type: 'Convenio',
    project: 'Sustentabilidad Agraria',
    date: '2024-01-15',
    uploadDate: '2024-01-15T10:00:00Z',
    authors: ['Dr. Mario Rojas', 'Dra. Elena Gómez'],
    keywords: ['Suelo', 'Fertilidad', 'Convenio'],
    content: 'Este documento establece las bases para la cooperación técnica en la mejora de la fertilidad de los suelos en la región andina.',
    imageUrl: 'https://picsum.photos/seed/agri1/600/400',
    isVigente: true,
    signingYear: 2024,
    counterpart: 'INTA',
    convenioSubType: 'Marco'
  },
  {
    id: '3',
    title: 'Proyecto de Extensión Rural: Huertas Comunitarias',
    type: 'Proyecto',
    project: 'Soberanía Alimentaria',
    date: '2023-11-05',
    uploadDate: '2023-11-05T14:30:00Z',
    authors: ['Lic. Rosa Martínez', 'Prof. Juan Pérez'],
    keywords: ['Comunidad', 'Huertas', 'Capacitación'],
    content: 'Plan integral para el desarrollo de 50 huertas comunitarias en el sector rural norte.',
    imageUrl: 'https://picsum.photos/seed/agri3/600/400'
  },
  {
    id: '4',
    title: 'Convenio de Pasantías: Facultad de Agronomía',
    type: 'Convenio',
    project: 'Prácticas Profesionales',
    date: '2023-05-20',
    uploadDate: '2023-05-20T09:15:00Z',
    authors: ['Dra. Silvia López'],
    keywords: ['Pasantías', 'Educación', 'Convenio'],
    content: 'Convenio para la realización de pasantías pre-profesionales de alumnos de último año.',
    imageUrl: 'https://picsum.photos/seed/agri4/600/400',
    isVigente: false,
    signingYear: 2023,
    counterpart: 'Ministerio de Agricultura',
    convenioSubType: 'Pasantía'
  }
];
