/** DeepSeek V4 Flash — modelo eficiente (cuota del doctor, ~7.1M tokens). */
export const CHAT_MODEL = "deepseek-v4-flash";

/** Sin thinking: respuestas más rápidas y menor consumo de tokens. */
export const DEEPSEEK_PROVIDER_OPTIONS = {
  deepseek: {
    thinking: { type: "disabled" as const },
  },
};

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
