import type { AxiosRequestConfig } from 'axios';
import { apiBffPlatform } from './platform';
import { apiBff } from './axios';

/**
 * Custom Mutator para Orval.
 * Orval lee las rutas del Swagger del Backend (ej: '/platform/plans').
 * Como usamos Next.js BFF en el cliente, interceptamos la llamada acá 
 * y la redirigimos a la instancia de Axios correspondiente.
 */
export const customMutator = async <T>(config: AxiosRequestConfig): Promise<T> => {
  let instance = apiBff;
  let finalUrl = config.url || '';

  // Si es una ruta de Platform, la despachamos por apiBffPlatform
  // que ya tiene el baseURL = '/api/platform'.
  // Limpiamos el prefijo '/platform' de la URL generada.
  if (finalUrl.startsWith('/platform')) {
    instance = apiBffPlatform;
    finalUrl = finalUrl.replace(/^\/platform/, '');
  }

  const response = await instance({
    ...config,
    url: finalUrl,
  });

  // Retornamos directamente response.data porque los endpoints generados por Orval esperan el T directo.
  return response.data;
};
