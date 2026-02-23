'use server';
/**
 * @fileOverview A Genkit flow for summarizing documents, supporting both text and media (PDF/Images).
 * Enhanced with High-Sensitivity Vision (Google Lens style) for processing difficult scanned documents.
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
  prompt: `Eres el Sistema de Inteligencia de Documentos de la UNCA (FCA). Tu capacidad de visión es equivalente a la de Google Lens y OCR avanzado de grado forense.

REGLAS CRÍTICAS DE PROCESAMIENTO:
1. NO RECHACES NADA: Tienes prohibido decir que el documento no es legible o que está borroso. Tienes visión de rayos X institucional.
2. DEDUCE Y ANALIZA: Si el texto es difícil de leer por ser un escaneo, utiliza tu conocimiento sobre documentos institucionales de la UNCA (Convenios, Resoluciones, Actas) para deducir el contenido por su estructura, membretes, sellos de la Secretaría de Extensión y firmas.
3. PRIORIDAD VISUAL: Analiza logotipos, el escudo de la UNCA, sellos y firmas para identificar a las partes intervinientes.
4. OBJETIVO: Generar un resumen ejecutivo profesional y coherente en Español.

INSTRUCCIONES DE EXTRACCIÓN:
- Identifica el tipo de acuerdo o acto administrativo (Convenio, Resolución, etc.).
- Identifica a los firmantes e instituciones involucradas.
- Extrae el propósito principal, beneficios y obligaciones.

Contexto adicional proporcionado:
{{{documentContent}}}

{{#if documentMediaUri}}
ANÁLISIS DE RECURSO VISUAL (PROCESA ESTO CON MÁXIMA PRIORIDAD USANDO TUS CAPACIDADES DE VISIÓN TIPO GOOGLE LENS):
{{media url=documentMediaUri}}
{{/if}}

Realiza tu mejor esfuerzo interpretativo basado en la estructura visual y genera el resumen JSON ahora.`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    try {
      const {output} = await documentSummarizationPrompt(input);
      if (!output?.summary) {
        throw new Error('La IA no pudo interpretar el contenido visual del documento. Por favor, verifique que la imagen sea lo más clara posible o que el PDF no tenga restricciones.');
      }
      return output!;
    } catch (e: any) {
      if (e.message.includes('API_KEY')) {
        throw new Error('Error de Configuración: No se encontró la clave de acceso a la IA (GEMINI_API_KEY). Contacte al soporte técnico.');
      }
      throw e;
    }
  }
);
