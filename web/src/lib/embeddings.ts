import { embed } from "ai";
import { google } from "@ai-sdk/google";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai-config";

/**
 * Genera vector de 768 dimensiones para búsqueda en pgvector.
 * DeepSeek no expone API de embeddings oficial; usamos Gemini solo para vectores
 * si GOOGLE_GENERATIVE_AI_API_KEY está configurada. Los chunks ya indexados en
 * Supabase también fueron generados con este modelo.
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Para búsqueda semántica configura GOOGLE_GENERATIVE_AI_API_KEY (solo embeddings) o usa búsqueda por texto."
    );
  }

  const { embedding } = await embed({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    value: texto,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMENSIONS },
    },
  });
  return embedding;
}
