# Spotify en JEEP CONNECT

Esta guía explica cómo conectar una cuenta real de Spotify a la app: flujo PKCE, registro de la Redirect URI, proxy HTTPS obligatorio en móvil, variables de entorno, límites de 2026 y diagnóstico de errores.

La app **no incluye credenciales**. Sin una app de Spotify configurada, la sección Música muestra el estado “Sin configurar” y no inventa datos.

---

## 1. Resumen del flujo

```text
App                         Proxy HTTPS                     Spotify
 │                               │                             │
 │ 1. Abre /authorize            │                             │
 │    (code_challenge, state,    │                             │
 │     redirect_uri=jeepconnect) │                             │
 ├──────────────────────────────►│                             │
 │                               │ 2. Reemplaza redirect_uri   │
 │                               │    por /callback y redirige │
 │                               ├────────────────────────────►│
 │                               │                             │
 │                               │ 3. Usuario autoriza         │
 │                               │◄────────────────────────────┤
 │                               │    /callback?code=…&state=… │
 │                               │                             │
 │ 4. Redirige a                 │                             │
 │    jeepconnect://spotify-     │                             │
 │    callback?code=…&state=…    │                             │
 │◄──────────────────────────────┤                             │
 │                                                             │
 │ 5. Canjea code + code_verifier + redirect_uri HTTPS         │
 ├────────────────────────────────────────────────────────────►│
 │◄────────────────────────────────────────────────────────────┤
 │    access_token, refresh_token, expires_in                  │
```

Puntos clave:

- Se usa **Authorization Code with PKCE**. No hay `client_secret`.
- Spotify solo acepta `https://` o loopback (`http://127.0.0.1`, `http://[::1]`). **No** acepta `localhost` ni esquemas personalizados como `jeepconnect://`.
- La app usa `jeepconnect://spotify-callback` como retorno interno, pero Spotify nunca lo ve: el proxy lo sustituye por su callback HTTPS.
- El canje del código debe enviar la **misma** Redirect URI HTTPS registrada, no el esquema personalizado. La app ya lo hace con `getTokenRedirectUri()`.
- El `state` y el `code_verifier` se conservan; el proxy no debe modificarlos.

---

## 2. Crear la app en Spotify

> Este proyecto tiene un proxy ya desplegado en `https://jeep-connect-spotify.jeep-connect-spotify.workers.dev`. Si lo usas, la Redirect URI que debes registrar es exactamente:
>
> ```text
> https://jeep-connect-spotify.jeep-connect-spotify.workers.dev/callback
> ```

1. Entra a <https://developer.spotify.com/dashboard>.
2. Crea una app (nombre y descripción libres).
3. En **Redirect URIs** agrega exactamente la URI del proxy (o la tuya):

   ```text
   https://TU-PROXY.example.com/callback
   ```

   Debe coincidir carácter por carácter con `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI`.
4. Guarda los cambios.
5. Copia el **Client ID**. El **Client Secret no se usa** y no debe incluirse en la app.
6. En **User Management**, agrega las cuentas de Spotify que probarán la app. En modo desarrollo el límite es de **5 usuarios** (para apps nuevas).
7. La cuenta dueña de la app debe tener **Spotify Premium** para poder crearla/mantenerla en modo desarrollo.

> Si Spotify muestra un aviso de “modo desarrollo”, es normal. Para uso público necesitas solicitar cuota extendida o pasar por el proceso de aprobación de Spotify. La app funciona igual con la cuota que tenga tu app.

---

## 3. Variables de entorno

Archivo `.env` en la raíz:

```dotenv
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=tu_client_id
EXPO_PUBLIC_SPOTIFY_REDIRECT_URI=https://jeep-connect-spotify.tu-subdominio.workers.dev/callback
EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL=https://jeep-connect-spotify.tu-subdominio.workers.dev
```

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Client ID público de la app. |
| `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI` | URI HTTPS registrada en Spotify. Se usa para el canje del token. |
| `EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL` | Base del proxy. La app abre `${base}/authorize` en lugar de `accounts.spotify.com/authorize`. |

Sin proxy, `EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL` queda vacío y la app usa directamente `https://accounts.spotify.com/authorize` con la URI registrada. Eso solo funciona si esa URI es accesible desde el navegador del dispositivo (por ejemplo, un loopback en web/escritorio). **En un teléfono no funcionará con `127.0.0.1`**, porque apunta al propio teléfono.

Reinicia el servidor de Expo después de cambiar `.env`; las variables `EXPO_PUBLIC_*` se incorporan al bundle en tiempo de build.

### Client ID en tiempo de ejecución

El APK instalado no necesita que el Client ID esté compilado. En **Ajustes → Spotify → Configuración OAuth** hay un campo para pegar el Client ID:

1. Copia el Client ID en el dashboard de Spotify.
2. Pégalo en el campo y pulsa **Guardar Client ID**.
3. Pulsa **Conectar con Spotify**.

El valor se guarda en AsyncStorage del dispositivo (es un dato público, no un secreto) y tiene prioridad sobre `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`. Al cambiarlo, la app borra los tokens emitidos con el Client ID anterior porque dejan de ser válidos.

---

## 4. Proxy HTTPS de ejemplo (Cloudflare Workers)

Crea un Worker con este código. También sirve como referencia para Vercel, Netlify, Deno Deploy o un servidor propio.

`src/index.js`:

```js
const SPOTIFY_AUTHORIZE = 'https://accounts.spotify.com/authorize';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const appReturn = env.APP_RETURN_URI || 'jeepconnect://spotify-callback';
    const spotifyRedirect = env.SPOTIFY_REDIRECT_URI;

    if (!spotifyRedirect) {
      return new Response('Falta SPOTIFY_REDIRECT_URI en el Worker', { status: 500 });
    }

    if (url.pathname === '/authorize') {
      // Evita un open redirect: solo se acepta el retorno propio de la app.
      const requested = url.searchParams.get('redirect_uri');
      if (requested && requested !== appReturn) {
        return new Response('redirect_uri no permitida', { status: 400 });
      }

      const target = new URL(SPOTIFY_AUTHORIZE);
      for (const [key, value] of url.searchParams) {
        if (key !== 'redirect_uri') target.searchParams.set(key, value);
      }
      target.searchParams.set('redirect_uri', spotifyRedirect);
      return Response.redirect(target.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const app = new URL(appReturn);
      for (const key of ['code', 'state', 'error']) {
        const value = url.searchParams.get(key);
        if (value) app.searchParams.set(key, value);
      }
      // 302 al esquema propio; ASWebAuthenticationSession / Custom Tabs lo capturan.
      return Response.redirect(app.toString(), 302);
    }

    return new Response('Jeep Connect · proxy de Spotify', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
```

`wrangler.toml`:

```toml
name = "jeep-connect-spotify"
main = "src/index.js"
compatibility_date = "2026-01-01"

[vars]
APP_RETURN_URI = "jeepconnect://spotify-callback"
SPOTIFY_REDIRECT_URI = "https://jeep-connect-spotify.tu-subdominio.workers.dev/callback"
```

Despliegue:

```bash
npx wrangler deploy
```

Comprobación rápida:

```bash
curl -I "https://TU-PROXY/authorize?client_id=test&response_type=code&redirect_uri=jeepconnect%3A%2F%2Fspotify-callback"
# Debe responder 302 hacia accounts.spotify.com/authorize
```

### Si el navegador bloquea el 302 al esquema propio

Algunos navegadores no siguen redirecciones a esquemas que no sean HTTP(S). Sustituye la respuesta de `/callback` por una página HTML con un enlace explícito:

```js
const target = app.toString();
return new Response(
  `<!doctype html><meta charset="utf-8">
   <title>Volver a Jeep Connect</title>
   <p>Autorización completada.</p>
   <p><a href="${target}">Volver a Jeep Connect</a></p>
   <script>location.replace(${JSON.stringify(target)})</script>`,
  { headers: { 'content-type': 'text/html; charset=utf-8' } },
);
```

`ASWebAuthenticationSession` (iOS) y Chrome Custom Tabs (Android) suelen capturar el 302 sin problema; el HTML es un respaldo.

### Alternativa loopback (solo desarrollo)

Spotify acepta `http://127.0.0.1:PUERTO/ruta` y `http://[::1]:PUERTO/ruta`, pero **no** `http://localhost`. Sirve para web o para un equipo de escritorio con el puerto reenviado. En un teléfono, `127.0.0.1` es el propio teléfono, así que no reemplaza al proxy.

---

## 5. Scopes solicitados

```text
user-read-private
user-read-email
user-read-playback-state
user-modify-playback-state
user-read-currently-playing
playlist-read-private
playlist-read-collaborative
user-library-read
```

La app no solicita scopes de escritura de playlists ni de perfil social. Si agregas scopes, actualiza también el dashboard y vuelve a autorizar (los tokens antiguos no los incluyen).

---

## 6. Dónde se guardan los tokens

- `expo-secure-store` (Keychain en iOS, Keystore en Android).
- Se guardan `access_token`, `refresh_token`, `expiresAt`, `scope` y el Client ID que emitió los tokens.
- El perfil no sensible (nombre, imagen) se guarda en AsyncStorage.
- Al desconectar se borran ambos.
- El token se renueva automáticamente si faltan menos de 60 segundos para expirar.
- Si la renovación falla, la app borra la sesión y pide volver a conectar.
- Si el Client ID cambia, los tokens anteriores se descartan automáticamente.

No hay backend propio que reciba tokens.

---

## 7. Cambios de la API de Spotify en 2026

La integración se adaptó a los cambios publicados por Spotify:

| Cambio | Cómo lo maneja la app |
| --- | --- |
| `GET /search` limita `limit` a 10 | `searchSpotify()` aplica `Math.min(10, limit)`. |
| Playlists usan `items` en lugar de `tracks` | `playlistTrackCount()` lee `items.total` y cae a `tracks.total`. Si no existe, muestra “PLAYLIST”. |
| `GET /me` puede omitir `product`, `country`, `email` y `followers` | El plan se muestra como Premium, Free o “Sin dato”; no se bloquea la reproducción por desconocer el plan. |
| Modo desarrollo limitado a 5 usuarios y dueño Premium | Documentado; la app no intenta evadir el límite. |
| Redirect URI insegura rechazada | Se exige HTTPS o loopback; se agregó el proxy. |

Referencias oficiales:

- <https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow>
- <https://developer.spotify.com/documentation/web-api/concepts/redirect_uri>
- <https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide>

---

## 8. Diagnóstico

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| “Falta el Client ID de Spotify” | No hay Client ID guardado ni variable de entorno | Pégalo en Ajustes → Spotify → Configuración OAuth y pulsa Guardar Client ID. |
| `invalid_client` al canjear el código | Client ID inexistente, revocado o de otra app | Copia de nuevo el Client ID del dashboard; no inventes uno. |
| `INVALID_CLIENT: Invalid redirect URI` | URI distinta a la registrada | Copia la URI exacta del dashboard; debe ser HTTPS y terminar en `/callback`. |
| La app vuelve pero no conecta | El proxy no redirige al esquema propio | Verifica `/callback` y que `APP_RETURN_URI` sea `jeepconnect://spotify-callback`. |
| `invalid_grant` al canjear | `redirect_uri` distinto o código ya usado | El canje debe usar la URI HTTPS registrada; no reutilices códigos. |
| “Spotify rechazó la acción” (403) | Cuenta Free o dispositivo no controlable | Usa Premium y abre Spotify en un dispositivo una vez. |
| “No hay un dispositivo activo” (404) | Ningún cliente de Spotify abierto | Abre Spotify en el teléfono, reproduce algo y reintenta. |
| 429 | Límite de peticiones | Espera y reduce la frecuencia; no hay reintentos agresivos. |
| El plan dice “Sin dato” | Campo `product` omitido en 2026 | Es normal; la app no bloquea. Si la cuenta es Free, Spotify devolverá 403 al controlar. |

---

## 9. Checklist de producción

- [ ] Redirect URI HTTPS registrada y verificada.
- [ ] Proxy desplegado con `APP_RETURN_URI` y `SPOTIFY_REDIRECT_URI` correctos.
- [ ] Client ID pegado en la app o definido en `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.
- [ ] `EXPO_PUBLIC_*` configuradas en EAS (`preview` y `production`) si compilas en la nube.
- [ ] Client Secret **no** incluido en el repositorio ni en el bundle.
- [ ] Cuenta dueña con Premium y usuarios de prueba agregados.
- [ ] Scopes revisados y consentimiento probado desde cero.
- [ ] Tokens verificados en Keychain/Keystore, no en AsyncStorage.
- [ ] Manejo de 401/403/404/429 probado con la app real.

---

## 10. Marcas

Spotify es una marca de Spotify AB. Jeep Connect no está afiliado a Spotify. El uso de la Web API está sujeto a los [términos de Spotify](https://developer.spotify.com/terms).
