import axios from 'axios';

const host = import.meta.env.VITE_API_HOST;
const port = import.meta.env.VITE_API_PORT || 8000;
const baseURL = `${window.location.protocol}//${host}:${port}`;

const api = axios.create({ baseURL });

export default api;
