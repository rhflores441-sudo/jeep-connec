// Proxy HTTPS para Spotify — Jeep Connect
// Traduce el callback HTTPS de Spotify al esquema jeepconnect:// de la app.
// Despliegue: ver README.md en esta carpeta. Ver docs/SPOTIFY.md.

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
