import axios from 'axios';

// =========================================================
// CONFIGURACIÓN DE ENTORNO
// =========================================================
const DEBUG = true; // Cambia a "false" para poder apuntar a producción

const API_LOCAL = 'http://localhost:5000/api';
const API_PRODUCCION = 'https://socialdata-backend.onrender.com/api'; // <--- Pon tu URL de producción aquí

const api = axios.create({
  baseURL: DEBUG ? API_LOCAL : API_PRODUCCION
});

// Interceptor para inyectar token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
