// Proxy HTTPS para Spotify y teselas del mapa — Jeep Connect
// 1) Traduce el callback HTTPS de Spotify al esquema jeepconnect:// de la app.
// 2) Sirve teselas CARTO/OSM desde el borde de Cloudflare, para redes donde
//    los CDN de mapas están bloqueados o inaccesibles.
// Despliegue: ver README.md en esta carpeta. Ver docs/SPOTIFY.md.

const SPOTIFY_AUTHORIZE = 'https://accounts.spotify.com/authorize';

const TILE_UPSTREAMS = {
  light: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  dark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

const TILE_PATTERN = /^\/tiles\/(light|dark|osm)\/(\d{1,2})\/(\d{1,7})\/(\d{1,7})\.png$/;

async function handleTile(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Método no permitido', { status: 405 });
  }

  const match = url.pathname.match(TILE_PATTERN);
  if (!match) {
    return new Response('Tesela no válida', { status: 400 });
  }

  const [, style, rawZ, rawX, rawY] = match;
  const z = Number(rawZ);
  const x = Number(rawX);
  const y = Number(rawY);
  const count = 2 ** z;

  if (z > 19 || x >= count || y >= count) {
    return new Response('Tesela fuera de rango', { status: 400 });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = TILE_UPSTREAMS[style]
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y));

  const upstreamHeaders =
    style === 'osm'
      ? {
          'User-Agent': 'JeepConnect/1.0 (tile proxy; +https://jeep-connect-spotify.jeep-connect-spotify.workers.dev)',
          Referer: 'https://jeep-connect-spotify.jeep-connect-spotify.workers.dev/',
        }
      : {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
          Referer: 'https://jeep-connect-spotify.jeep-connect-spotify.workers.dev/',
          Accept: 'image/png,image/*;q=0.8,*/*;q=0.5',
        };

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstream, {
      headers: upstreamHeaders,
      cf: { cacheEverything: true, cacheTtl: 604800 },
    });
  } catch {
    return new Response('No se pudo contactar el servidor de teselas', { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return new Response(`El servidor de teselas respondió con error (${upstreamResponse.status})`, {
      status: 502,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const response = new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      'content-type': upstreamResponse.headers.get('content-type') || 'image/png',
      'cache-control': 'public, max-age=604800, immutable',
      'access-control-allow-origin': '*',
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/tiles/')) {
      return handleTile(request, url);
    }

    const appReturn = env.APP_RETURN_URI || 'jeepconnect://spotify-callback';
    const spotifyRedirect = env.SPOTIFY_REDIRECT_URI;

    if (url.pathname === '/authorize' || url.pathname === '/callback') {
      if (!spotifyRedirect) {
        return new Response('Falta SPOTIFY_REDIRECT_URI en el Worker', { status: 500 });
      }
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

    return new Response('Jeep Connect · proxy de Spotify y teselas del mapa', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
