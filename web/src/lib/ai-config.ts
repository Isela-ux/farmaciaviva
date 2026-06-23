/** Modelo de chat DeepSeek (compatible con AI SDK). */
export const CHAT_MODEL = "deepseek-chat";

/** Modelo usado al indexar embeddings (768 dims, pgvector). */
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

export function tieneClaveDeepSeek(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

/** Clave opcional solo para generar embeddings de consulta (768 dims). */
export function tieneClaveEmbeddings(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}
