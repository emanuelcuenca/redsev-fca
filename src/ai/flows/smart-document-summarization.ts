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
1. NO RECHACES NADA: Tienes prohibido decir que el documento no es legible o que está borroso.
2. DEDUCE Y ANALIZA: Si el texto es difícil de leer, utiliza tu conocimiento sobre documentos institucionales de la UNCA (Convenios, Resoluciones, etc.) para deducir el contenido por su estructura, membretes, sellos y firmas.
3. PRIORIDAD VISUAL: Lee logotipos, sellos de la Secretaría de Extensión y Vinculación, y firmas para identificar a las partes.
4. OBJETIVO: Generar un resumen ejecutivo profesional en Español.

INSTRUCCIONES DE EXTRACCIÓN:
- Identifica el tipo de acuerdo o acto administrativo.
- Identifica a los firmantes (Instituciones, Empresas, Personal FCA).
- Extrae el propósito principal o los beneficios del acuerdo.

Contexto adicional:
{{{documentContent}}}

{{#if documentMediaUri}}
ANÁLISIS DE RECURSO VISUAL (PROCESA ESTO CON MÁXIMA PRIORIDAD):
{{media url=documentMediaUri}}
{{/if}}

Ignora cualquier advertencia de baja resolución. Realiza tu mejor esfuerzo interpretativo y genera el resumen JSON ahora.`,
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
        throw new Error('La IA no pudo interpretar el contenido del documento. Por favor, intente con una captura más nítida o verifique el archivo.');
    }
    return output!;
  }
);
