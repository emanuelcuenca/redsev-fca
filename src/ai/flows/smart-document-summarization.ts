'use server';
/**
 * @fileOverview A Genkit flow for summarizing documents, supporting both text and media (PDF/Images).
 *
 * - summarizeDocument - A function that handles the document summarization process.
 * - DocumentSummarizationInput - The input type for the summarizeDocument function.
 * - DocumentSummarizationOutput - The return type for the summarizeDocument function.
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
  prompt: `You are an expert assistant specialized in analyzing and summarizing institutional agricultural documents for the UNCA.

Your task is to analyze the provided source and generate a concise summary in Spanish.

The source may be text, a PDF document, or a scanned image. 
- If media is provided (PDF or Image), read it carefully, performing OCR if necessary.
- If text is provided, use it as additional context or content.
- Determine if the document is a convenio, project, or resolution and extract:
  1. Main purpose
  2. Institutions or actors involved
  3. Key dates or financial amounts (if applicable)

Document Text Context:
{{documentContent}}

{{#if documentMediaUri}}
Document Content (File):
{{media url=documentMediaUri}}
{{/if}}

Always respond in Spanish, focusing on being concise and professional.`,
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
