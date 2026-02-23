'use server';
/**
 * @fileOverview A Genkit flow for summarizing documents, supporting both text and images (OCR).
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
    .describe('The text content of the document if available.'),
  documentImageUri: z
    .string()
    .optional()
    .describe('A data URI of a scanned document page (base64 encoded).'),
});
export type DocumentSummarizationInput = z.infer<
  typeof DocumentSummarizationInputSchema
>;

const DocumentSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary or key points extracted from the document.'),
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
  prompt: `You are an expert assistant specialized in analyzing and summarizing institutional agricultural documents.

Your task is to analyze the provided source (text or image) and generate a concise summary in Spanish.

If an image is provided, perform OCR and analyze the visual structure to extract key information.
If text is provided, summarize it directly.

Focus on:
- Purpose of the document
- Key actors or institutions involved
- Main objectives or conclusions

Document Text Content:
{{documentContent}}

{{#if documentImageUri}}
Document Scanned Page:
{{media url=documentImageUri}}
{{/if}}
`,
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
