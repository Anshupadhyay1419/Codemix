// Use VITE_API_URL environment variable if provided.
// Falls back to the HuggingFace backend in production, or localhost in dev.
export const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.PROD ? 'https://anant-ai-backend.hf.space/api' : 'http://localhost:8000/api');

export const NLP_API_URL = `${API_URL}/nlp`;
