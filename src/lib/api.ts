import axios from 'axios'

// Sessão é cookie HttpOnly: withCredentials é obrigatório
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
