
export interface PersonName {
  firstName: string;
  lastName: string;
}

export interface StaffMember extends PersonName {
  id: string;
  category: 'Docente' | 'Estudiante' | 'No Docente' | 'Externo';
  academicRank?: string;
  email?: string;
  updatedAt?: string;
}

export interface AgriculturalDocument {
  id: string;
  title: string;
  type: 'Convenio' | 'Proyecto' | 'Movilidad Estudiantil' | 'Movilidad Docente' | 'Pasantía' | 'Resolución' | 'Otro';
  projectCode?: string;
  director?: PersonName;
  student?: PersonName;
  date: string;
  uploadDate: string;
  uploadedByUserId: string;
  authors: PersonName[];
  description: string;
  objetivoGeneral?: string;
  objetivosEspecificos?: string[];
  fileUrl: string;
  fileType: string;
  durationYears?: number;
  hasAutomaticRenewal?: boolean;
  counterparts?: string[];
  hasInstitutionalResponsible?: boolean;
  extensionDocType?: 'Proyecto de Extensión' | 'Resolución de aprobación' | 'Informe de avance' | 'Informe final';
  executionPeriod?: string;
  mobilityStartDate?: string;
  mobilityEndDate?: string;
  mobilityInstitution?: string;
  mobilityState?: string;
  mobilityCountry?: string;
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

export function formatPersonName(person?: PersonName): string {
  if (!person || (!person.firstName && !person.lastName)) return 'Sin asignar';
  return `${person.lastName}, ${person.firstName}`;
}
