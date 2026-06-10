# Design: JWT en Cookies HttpOnly

## 1. Cambios en Backend (API)
* **Cookie Parser:** Registrar el middleware `cookie-parser` en `api/src/main.ts`.
* **Auth Controller:** 
  * Modificar `login` para usar `@Res({ passthrough: true }) res: Response` y setear la cookie usando `res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'strict' })`.
  * Modificar `logout` para hacer `res.clearCookie('access_token')`.
* **JWT Strategy:** Modificar la estrategia de Passport (`JwtStrategy`) para extraer el token desde las cookies de la petición además de los headers (como fallback para desarrollo rápido si es necesario).
  * Usar `ExtractJwt.fromExtractors([ (req) => req?.cookies?.access_token, ExtractJwt.fromAuthHeaderAsBearerToken() ])`.

## 2. Cambios en Frontend (App)
* **Axios / Fetch Instance:** Configurar la instancia HTTP de Axios o Fetch para incluir siempre `withCredentials: true`.
* **Middleware de Next.js:** Asegurar que el middleware de Next.js (`app/src/middleware.ts`) pueda leer la cookie `access_token` directamente usando `request.cookies.get('access_token')` para proteger las rutas privadas.
