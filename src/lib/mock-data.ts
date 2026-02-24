export interface AgriculturalDocument {
  id: string;
  title: string;
  type: 'Convenio' | 'Proyecto' | 'Movilidad' | 'Pasantía' | 'Resolución' | 'Otro';
  resolutionType?: 'CD' | 'CS' | 'Decanal' | 'Rectoral' | 'SEU' | 'Ministerial';
  project?: string;
  projectCode?: string; // Código unificador para proyectos (Formato: FCA-EXT-001-2024)
  date: string; // En Convenios es fecha de firma, en Proyectos es fecha de aprobación
  authors: string[];
  description: string;
  objetivoGeneral?: string;
  objetivosEspecificos?: string[];
  content?: string;
  imageUrl?: string;
  fileUrl: string;
  fileType: string;
  // Campos específicos para Convenios y Resoluciones
  isVigente?: boolean;
  durationYears?: number;
  hasAutomaticRenewal?: boolean;
  signingYear?: number;
  resolutionYear?: number; // Año específico para resoluciones
  counterpart?: string;
  convenioSubType?: 'Marco' | 'Específico';
  convenioCategory?: string; // Área de aplicación
  hasInstitutionalResponsible?: boolean;
  // Campos específicos para Movilidad y Pasantías
  beneficiaryName?: string;
  programName?: string;
  convocatoria?: string;
  destinationInstitution?: string;
  destinationProvince?: string;
  destinationCountry?: string;
  // Campos específicos para Proyectos de Extensión
  extensionDocType?: 'Proyecto' | 'Resolución de aprobación' | 'Informe de avance' | 'Informe final';
  presentationDate?: string;
  reportPeriod?: string;
  executionPeriod?: string;
  uploadDate: string;
  uploadedByUserId: string;
  // Asociación con Convenio (Pasantías)
  hasAssociatedConvenio?: boolean;
  associatedConvenioNumber?: string;
  associatedConvenioYear?: number;
}

export function isDocumentVigente(doc: AgriculturalDocument): boolean {
  if (doc.type !== 'Convenio') return true;
  if (doc.hasAutomaticRenewal) return true;
  if (!doc.date || !doc.durationYears) return true;
  
  const signingDate = new Date(doc.date);
  const expiryDate = new Date(signingDate);
  expiryDate.setFullYear(signingDate.getFullYear() + doc.durationYears);
  
  return expiryDate > new Date();
}

export const MOCK_DOCUMENTS: AgriculturalDocument[] = [
  {
    id: '1',
    title: 'Convenio de Cooperación Técnica: Gestión de Suelos 2024',
    type: 'Convenio',
    date: '2024-01-15',
    uploadDate: '2024-01-15T10:00:00Z',
    authors: ['Dr. Mario Rojas'],
    description: 'Este documento establece las bases para la cooperación técnica en la mejora de la fertilidad de los suelos en la región andina.',
    durationYears: 2,
    hasAutomaticRenewal: false,
    signingYear: 2024,
    counterpart: 'INTA',
    convenioSubType: 'Marco',
    convenioCategory: 'Colaboración',
    hasInstitutionalResponsible: true,
    fileUrl: "#",
    fileType: "application/pdf",
    uploadedByUserId: "mock"
  },
  {
    id: '3',
    title: 'Proyecto de Extensión Rural: Huertas Comunitarias',
    type: 'Proyecto',
    date: '2023-11-05',
    uploadDate: '2023-11-05T14:30:00Z',
    authors: ['Lic. Rosa Martínez', 'Prof. Juan Pérez'],
    description: 'Plan integral para el desarrollo de 50 huertas comunitarias en el sector rural norte.',
    extensionDocType: 'Proyecto',
    executionPeriod: '2023-2024',
    projectCode: 'FCA-EXT-001-2023',
    fileUrl: "#",
    fileType: "application/pdf",
    uploadedByUserId: "mock"
  }
];
