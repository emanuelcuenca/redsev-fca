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
  prompt: `Eres el Sistema de Inteligencia de Documentos de la FCA - UNCA. Tienes capacidades de visión avanzadas equivalentes a Google Lens y OCR de grado forense.

REGLAS DE PROCESAMIENTO VISUAL CRÍTICAS:
1. VISIÓN AGRESIVA: Si el documento es un escaneo, una foto o está borroso, NO RECHACES LA TAREA. Usa tu capacidad de deducción para leer membretes, sellos institucionales (Secretaría de Extensión y Vinculación) y firmas.
2. CONOCIMIENTO INSTITUCIONAL: Sabes que los documentos de la UNCA suelen ser Convenios (Marco/Específicos), Resoluciones o Actas. Usa esta estructura para interpretar el contenido difícil de leer.
3. OBJETIVO: Generar un resumen ejecutivo profesional y coherente en Español que identifique:
   - Tipo de documento y número si es visible.
   - Partes intervinientes (FCA, UNCA, Ministerios, Empresas, etc.).
   - Propósito principal del acuerdo o acto administrativo.

Contexto previo: {{{documentContent}}}

{{#if documentMediaUri}}
RECURSO VISUAL (ANALIZAR CON PRIORIDAD MÁXIMA USANDO CAPACIDADES DE LENTE):
{{media url=documentMediaUri}}
{{/if}}

Genera el resumen ahora en formato JSON.`,
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
        throw new Error('La IA no pudo extraer información del archivo. Por favor, asegúrese de que el documento sea visible y esté bien iluminado.');
      }
      return output!;
    } catch (e: any) {
      // Manejo mejorado del error de API KEY
      if (e.message.toLowerCase().includes('api_key') || e.message.toLowerCase().includes('api key')) {
        throw new Error('Error de Conexión: No se encontró la clave de acceso a la IA (GEMINI_API_KEY). Verifique su configuración institucional.');
      }
      throw e;
    }
  }
);
