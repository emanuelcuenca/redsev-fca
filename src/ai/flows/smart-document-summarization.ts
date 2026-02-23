
'use server';
/**
 * @fileOverview Flujo de Genkit para el análisis y resumen de documentos institucionales.
 * Soporta documentos legibles y escaneos de alta dificultad (estilo Google Lens).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSummarizationInputSchema = z.object({
  documentContent: z
    .string()
    .optional()
    .describe('Contenido de texto o contexto del documento.'),
  documentMediaUri: z
    .string()
    .optional()
    .describe('Data URI del documento (PDF o Imagen), codificado en base64.'),
});
export type DocumentSummarizationInput = z.infer<
  typeof DocumentSummarizationInputSchema
>;

const DocumentSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe('Resumen ejecutivo conciso extraído del documento en Español.'),
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
  prompt: `Eres el Analista de Inteligencia Documental de la Secretaría de Extensión y Vinculación (FCA-UNCA). 
Tu misión es actuar como un experto en visión artificial (estilo Google Lens) para extraer información de documentos institucionales.

DIRECTIVAS CRÍTICAS DE VISIÓN:
1. SI EL DOCUMENTO ES UN ESCANEO O FOTO: Analiza visualmente cada parte del recurso. Identifica membretes, sellos, fechas y firmas. No te detengas por la baja resolución o ruido visual; usa tu capacidad de deducción.
2. CONTEXTO FCA-UNCA: Los documentos suelen ser Convenios, Resoluciones, Proyectos de Extensión o Actas. Busca las partes intervinientes (FCA, UNCA, Contrapartes) y el propósito del acuerdo.
3. IDIOMA: El resumen debe ser exclusivamente en Español, profesional y directo.

Contexto previo: {{{documentContent}}}

{{#if documentMediaUri}}
RECURSO VISUAL (ANALIZAR CON PRIORIDAD MÁXIMA):
{{media url=documentMediaUri}}
{{/if}}

Genera el resumen ahora en formato JSON estableciendo el campo "summary".`,
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: DocumentSummarizationInputSchema,
    outputSchema: DocumentSummarizationOutputSchema,
  },
  async input => {
    try {
      // Verificación de API Key con nombres alternativos
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error('CONFIG_ERROR: No se encontró una clave de acceso válida (GEMINI_API_KEY) en las variables de entorno del servidor.');
      }

      const {output} = await documentSummarizationPrompt(input);
      if (!output?.summary) {
        throw new Error('La IA no pudo procesar el contenido visual del archivo. Asegúrese de que el documento sea visible.');
      }
      return output!;
    } catch (e: any) {
      console.error('Flow Error:', e);
      if (e.message.includes('CONFIG_ERROR') || e.message.toLowerCase().includes('api_key') || e.message.toLowerCase().includes('api key')) {
        throw new Error('Error de Acceso: El sistema no encuentra la GEMINI_API_KEY para acceder a la IA. Verifique el archivo .env o la configuración del servidor.');
      }
      throw e;
    }
  }
);
