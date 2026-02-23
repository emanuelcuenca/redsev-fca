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
  prompt: `Eres un Asistente de Inteligencia de Documentos avanzado para la UNCA (FCA). 
Tu especialidad es el análisis visual y la extracción de texto (OCR) de documentos institucionales, convenios y proyectos.

INSTRUCCIONES CRÍTICAS:
1. SI SE PROPORCIONA UNA IMAGEN O PDF (Media): Analiza visualmente el archivo con extrema precisión. Lee sellos, firmas, membretes y texto manuscrito si lo hay. 
2. EXTRAE: Propósito del documento, actores involucrados (instituciones, personas), fechas clave y montos si aplica.
3. SI ES UN ESCANEO: No digas que es difícil de leer; haz tu mejor esfuerzo para extraer los puntos clave.
4. IDIOMA: Responde siempre en Español de forma profesional y concisa.

Contexto del Texto (si existe):
{{documentContent}}

{{#if documentMediaUri}}
CONTENIDO DEL ARCHIVO (Analiza visualmente este recurso):
{{media url=documentMediaUri}}
{{/if}}

Genera un resumen ejecutivo que permita entender de qué trata el documento sin tener que leerlo completo.`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    const {output} = await documentSummarizationPrompt(input);
    return output!;
  }
);
