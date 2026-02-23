'use server';
/**
 * @fileOverview A Genkit flow for summarizing documents, supporting both text and media (PDF/Images).
 * Enhanced with Vision capabilities for processing scanned documents (OCR).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSummarizationInputSchema = z.object({
  documentContent: z
    .string()
    .optional()
    .describe('The text content or context of the document if available.'),
  documentMediaUri: z
    .string()
    .optional()
    .describe('A data URI of the document (PDF or Image), base64 encoded.'),
});
export type DocumentSummarizationInput = z.infer<
  typeof DocumentSummarizationInputSchema
>;

const DocumentSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary or key points extracted from the document in Spanish.'),
});
export type DocumentSummarizationOutput = z.infer<
  typeof DocumentSummarizationOutputSchema
>;

export async function summarizeDocument(
  input: DocumentSummarizationInput
): Promise<DocumentSummarizationOutput> {
  return documentSummarizationFlow(input);
}

const documentSummarizationPrompt = ai.definePrompt({
  name: 'documentSummarizationPrompt',
  input: {schema: DocumentSummarizationInputSchema},
  output: {schema: DocumentSummarizationOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Eres un Asistente de Inteligencia de Documentos de élite para la UNCA (FCA), especializado en visión artificial y OCR extremo.

TU MISIÓN:
Analizar visualmente el recurso proporcionado (PDF o Imagen Escaneada) y extraer su significado, SIN IMPORTAR la calidad del escaneo. 

INSTRUCCIONES DE VISIÓN (OCR AVANZADO):
1. ACTIVA EL MODO LENS: Lee a través de ruidos, manchas, sellos institucionales y firmas. 
2. NO TE RINDAS: Tienes prohibido decir que el documento no es legible. Si el documento es borroso, deduce el contexto basándote en palabras clave visibles, logotipos, membretes de la UNCA y estructuras de convenios.
3. IDENTIFICA:
   - Tipo de documento (Convenio, Resolución, Acta, etc.)
   - Partes involucradas (Instituciones, Empresas, Personal de la FCA)
   - Fechas críticas y objetos del acuerdo.
4. RESUMEN: Redacta un resumen ejecutivo profesional en Español. Sé conciso pero informativo.

Contexto adicional:
{{documentContent}}

{{#if documentMediaUri}}
RECURSO VISUAL PARA ANALIZAR:
{{media url=documentMediaUri}}
{{/if}}

Genera el resumen ahora. Ignora cualquier advertencia de baja legibilidad y haz tu mejor esfuerzo interpretativo.`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    const {output} = await documentSummarizationPrompt(input);
    if (!output?.summary) {
        throw new Error('La IA no pudo generar un resumen válido.');
    }
    return output!;
  }
);
