export const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.PROD ? 'https://anant-ai-backend.hf.space/api' : 'http://localhost:8000/api');

export const NLP_API_URL = `${API_URL}/nlp`;
