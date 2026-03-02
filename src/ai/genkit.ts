import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuración central de Genkit.
 * Si las variables de entorno no están presentes, se usa un valor por defecto para evitar que el servidor falle al iniciar.
 * La validación real ocurre dentro de los flujos.
 */
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || 'NOT_CONFIGURED';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
