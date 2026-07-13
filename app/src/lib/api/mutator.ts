import type { AxiosRequestConfig } from 'axios';
import { apiBffPlatform } from './platform';
import { apiBff } from './axios';

/**
 * Custom Mutator para Orval.
 * Orval lee las rutas del Swagger del Backend (ej: '/platform/plans').
 * Como usamos Next.js BFF en el cliente, interceptamos la llamada acá
 * y la redirigimos a la instancia de Axios correspondiente.
 *
 * El cliente `react-query` de Orval (sin `httpClient: 'axios'` explícito en
 * orval.config.js) genera llamadas estilo fetch: `customMutator(url, init)`,
 * con `init.body` como string ya serializado (`JSON.stringify(dto)`) — no un
 * único `AxiosRequestConfig`. Esta firma matchea eso, no lo que Axios espera.
 */
export const customMutator = async <T>(
  url: string,
  init?: RequestInit,
): Promise<T> => {
  let instance = apiBff;
  let finalUrl = url;

  // Si es una ruta de Platform, la despachamos por apiBffPlatform
  // que ya tiene el baseURL = '/api/platform'.
  // Limpiamos el prefijo '/platform' de la URL generada.
  if (finalUrl.startsWith('/platform')) {
    instance = apiBffPlatform;
    finalUrl = finalUrl.replace(/^\/platform/, '');
  }

  const { method, headers, body, signal } = init ?? {};

  const config: AxiosRequestConfig = {
    url: finalUrl,
    method: method as AxiosRequestConfig['method'],
    headers: headers as Record<string, string> | undefined,
    data: typeof body === 'string' ? JSON.parse(body) : body,
    signal: signal ?? undefined,
  };

  const response = await instance(config);

  // Retornamos directamente response.data porque los endpoints generados por Orval esperan el T directo.
  return response.data;
};
