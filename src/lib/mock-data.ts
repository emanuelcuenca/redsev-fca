
export interface AgriculturalDocument {
  id: string;
  title: string;
  type: 'Convenio' | 'Proyecto' | 'Movilidad' | 'Pasantía' | 'Resolución' | 'Reglamento' | 'Otro';
  project?: string;
  date: string;
  authors: string[];
  keywords: string[];
  description: string;
  content?: string;
  imageUrl?: string;
  // Campos específicos para Convenios
  isVigente?: boolean;
  signingYear?: number;
  counterpart?: string;
  convenioSubType?: 'Marco' | 'Específico' | 'Práctica/Pasantía';
  hasInstitutionalResponsible?: boolean;
  // Campos específicos para Movilidad y Pasantías
  beneficiaryName?: string;
  programName?: string;
  convocatoria?: string;
  uploadDate: string;
}

export const MOCK_DOCUMENTS: AgriculturalDocument[] = [
  {
    id: '1',
    title: 'Convenio de Cooperación Técnica: Gestión de Suelos 2024',
    type: 'Convenio',
    date: '2024-01-15',
    uploadDate: '2024-01-15T10:00:00Z',
    authors: ['Dr. Mario Rojas'],
    keywords: ['Suelo', 'Fertilidad', 'Convenio'],
    description: 'Este documento establece las bases para la cooperación técnica en la mejora de la fertilidad de los suelos en la región andina.',
    isVigente: true,
    signingYear: 2024,
    counterpart: 'INTA',
    convenioSubType: 'Marco',
    hasInstitutionalResponsible: true
  },
  {
    id: '3',
    title: 'Proyecto de Extensión Rural: Huertas Comunitarias',
    type: 'Proyecto',
    date: '2023-11-05',
    uploadDate: '2023-11-05T14:30:00Z',
    authors: ['Lic. Rosa Martínez', 'Prof. Juan Pérez'],
    keywords: ['Comunidad', 'Huertas', 'Capacitación'],
    description: 'Plan integral para el desarrollo de 50 huertas comunitarias en el sector rural norte.'
  }
];
