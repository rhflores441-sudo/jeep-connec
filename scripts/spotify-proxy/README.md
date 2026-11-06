# Proxy HTTPS para Spotify

Worker de Cloudflare que traduce el callback de Spotify al esquema
`jeepconnect://spotify-callback` de la app. Flujo completo en
[`docs/SPOTIFY.md`](../../docs/SPOTIFY.md).

## Despliegue

```bash
npx wrangler login
npx wrangler deploy
```

Tras desplegar, anota la URL pública (ej.
`https://jeep-connect-spotify.<tu-subdominio>.workers.dev`) y ponla en:

1. **`wrangler.toml`** → `SPOTIFY_REDIRECT_URI = "<URL>/callback"` y vuelve a desplegar.
2. **Spotify Dashboard** → Redirect URI exacta: `<URL>/callback`.
3. **`.env`** (raíz del repo, no se commitea):
   ```dotenv
   EXPO_PUBLIC_SPOTIFY_CLIENT_ID=<tu-client-id>
   EXPO_PUBLIC_SPOTIFY_REDIRECT_URI=<URL>/callback
   EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL=<URL>
   ```
4. **EAS** (para el APK):
   ```bash
   eas env:create --name EXPO_PUBLIC_SPOTIFY_CLIENT_ID --value "<tu-client-id>" --environment preview --visibility plaintext
   eas env:create --name EXPO_PUBLIC_SPOTIFY_REDIRECT_URI --value "<URL>/callback" --environment preview --visibility plaintext
   eas env:create --name EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL --value "<URL>" --environment preview --visibility plaintext
   # Repite con --environment production para el AAB
   ```

Comprobación rápida: abrir `<URL>/authorize?client_id=test&response_type=code&redirect_uri=jeepconnect%3A%2F%2Fspotify-callback`
debe responder 302 hacia `accounts.spotify.com/authorize`.

> El Client ID es **público** (va en el bundle). El Client Secret **no** se usa
> (flujo PKCE) y nunca debe commitearse.
