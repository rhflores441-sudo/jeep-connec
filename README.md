# JEEP CONNECT

Centro de infoentretenimiento para **Jeep Liberty 2010** (verde natural metálico), construido con Expo + React Native + TypeScript. La interfaz está en español, sigue una estética inspirada en Apple CarPlay y ofrece dos composiciones: una vertical para el teléfono y un tablero panorámico horizontal para el modo automotriz.

> **Aviso de no afiliación.** Jeep es una marca de Stellantis. Este es un proyecto personal e independiente, sin relación con Stellantis, Jeep, Apple, Spotify, CARTO, OpenStreetMap ni Radio Browser. Las marcas se mencionan únicamente con fines descriptivos.

---

## Estado del proyecto

| Comprobación | Estado |
| --- | --- |
| TypeScript (`pnpm exec tsc --noEmit`) | ✅ Sin errores |
| ESLint (`pnpm exec expo lint`) | ✅ 0 errores / 0 advertencias |
| Bundle Android (`pnpm exec expo export --platform android`) | ✅ 4 033 módulos, bundle Hermes ~7 MB |
| Configuración Expo (`pnpm exec expo config --type public`) | ✅ Válida para SDK 58 |
| `pnpm exec expo-doctor` | ✅ 20/20 (verificado tras `git init`) |
| APK preview | ✅ **Generado** (EAS + parche de bundle Hermes, 2026-11-06) |
| AAB / Build iOS | ⚠️ **Pendientes** (AAB: perfil `production`; iOS: requiere credenciales Apple) |

**Detalle de `expo-doctor` (20/20):** ahora que el directorio es un repositorio Git y Git está en el `PATH`, las 20 comprobaciones pasan. Las 2 que antes fallaban dependían de Git (`.expo` ignorado y sincronización CNG para `android/`/`ios/`, ambas ya en `.gitignore`).

**APK instalable (2026-11-06):** parte del APK `preview` de EAS (build `cf5036e0-bd4d-4407-98f4-0bc54277591a`, commit `1b61be3`, versión 1.0.0 v1, SDK 58) y se le reemplazó `assets/index.android.bundle` por un bundle Hermes recompilado localmente con los cambios más recientes. Se alineó y firmó con el keystore de depuración del proyecto (`scripts/patch-apk.ps1`). Artefacto: `dist/jeep-connect-preview.apk` (~110 MB, no se commitea porque `dist/` está gitignored). Proyecto EAS vinculado: `66c7e78d-8e83-41d7-82d5-2b7f41ec0675`, owner `ing.fhernandez`. Repo GitHub: https://github.com/rhflores441-sudo/jeep-connec. Para el AAB y iOS sigue la guía en [Compilar APK y AAB](#compilar-apk-y-aab).

> Como el APK parcheado usa la clave de depuración, la primera instalación exige desinstalar la versión firmada por EAS. Los parches posteriores se instalan encima sin borrar datos.

El arte del vehículo es una **ilustración SVG original** (`src/components/vehicle/JeepLiberty.tsx`), no una fotografía ni un render oficial. Puedes sustituirla por una imagen propia; consulta [Arte del vehículo](#arte-del-vehículo).

---

## Características

### Inicio
- Reloj en vivo, fecha larga en español y nombre/color del vehículo.
- Clima actual, temperatura, sensación térmica, viento, humedad, pronóstico por hora y próximos días (Open-Meteo, sin API key).
- Velocidad GPS real, precisión, rumbo y estado de la señal.
- Estado de red (Wi-Fi, datos, sin conexión), batería y carga.
- Accesos directos a mapa, radio, música, clima, apps e historial.
- Reproductor unificado para radio y Spotify con carátula, progreso y controles.
- Ilustración SVG del Jeep Liberty con color de carrocería del tema.

### Mapa
- Teselas ráster de OpenStreetMap servidas por CARTO (claro/oscuro).
- Búsqueda de lugares con Nominatim.
- Ruta real con OSRM: distancia, duración y geometría dibujada sobre el mapa.
- Ubicación GPS o ubicación manual; marcador de destino y lugares favoritos.
- Historial de búsquedas/rutas y estilos de mapa persistentes.

### Radio
- Catálogo de Radio Browser: estaciones de México, tendencias y géneros.
- Búsqueda por nombre, favoritos persistentes y reproducción con `expo-audio`.
- Manejo de estaciones caídas, timeouts y servidores alternativos de Radio Browser.
- Historial de reproducción y ficha de la estación.

### Música (Spotify)
- OAuth 2.0 con **PKCE** (sin client secret).
- Búsqueda de canciones, álbumes, artistas y playlists.
- Playlists del usuario, dispositivos disponibles y transferencia de reproducción.
- Reproducción, pausa, siguiente/anterior, seek y volumen mediante Spotify Web API.
- Tokens cifrados en Keychain/Keystore con `expo-secure-store`.
- Compatibilidad con los cambios de la API de Spotify de 2026 (límite de búsqueda, `items` en playlists, campos opcionales de `/me`).

### Más
- Modo automotriz horizontal con reloj, clima, velocidad, estado y reproductor.
- Pantalla de apps con accesos a todas las secciones.
- Historial unificado de radio y Spotify.
- Ajustes: tema claro/oscuro/sistema, unidades, volumen, ecualizador (presets persistidos), mapa, ubicación, permisos y Spotify.
- Pantalla “Acerca de” con créditos, limitaciones y enlaces.
- Onboarding de tres pasos, pantalla 404 en español y estados de carga/error/vacío.

---

## Stack

| Área | Tecnología |
| --- | --- |
| Runtime | Expo SDK 58, React Native 0.88.1, React 19.3.0 |
| Lenguaje | TypeScript 6 |
| Navegación | Expo Router 58 (`src/app/`) |
| Animación | React Native Reanimated 4 + Gesture Handler 3 |
| UI | Componentes propios, Lucide, `expo-linear-gradient`, `expo-blur`, `expo-image` |
| Estado | React Context + hooks, AsyncStorage para preferencias |
| Seguridad | `expo-secure-store` para tokens de Spotify |
| Audio | `expo-audio` (radio y reproducción en segundo plano) |
| Ubicación | `expo-location` |
| Mapas | Teselas ráster OSM/CARTO + OSRM + Nominatim |
| Build | Gradle local (`android/`, CNG), EAS Build o parche del bundle Hermes sobre un APK existente |

---

## Requisitos

- Node.js 20 o superior y **pnpm 12** (el proyecto está fijado con `packageManager`). También funciona npm si se regenera el lockfile, pero no mezcles gestores.
- Cuenta de Expo/EAS solo si vas a compilar en la nube (opcional).
- Para builds locales: Android Studio + Android SDK, o Xcode en macOS.
- Un teléfono con Expo Go para una vista rápida (con limitaciones) o un **development build** para todas las capacidades nativas.
- Opcional: cuenta de Spotify Premium y una app creada en el dashboard de Spotify. En modo desarrollo 2026, el dueño de la app debe tener Premium.

---

## Instalación

```bash
# 1. Dependencias (pnpm está fijado en package.json)
pnpm install

# 2. Variables de entorno
#    Windows (PowerShell)
Copy-Item .env.example .env
#    macOS / Linux
cp .env.example .env

# 3. Edita .env y completa al menos las variables de Spotify si vas a usar Música

# 4. Arranca el servidor de desarrollo
pnpm run start
```

Abre el proyecto con Expo Go escaneando el QR, o compila un development build para probar audio en segundo plano, HTTP sin TLS y el resto de la configuración nativa:

```bash
pnpm exec expo run:android   # requiere Android SDK local
# o
eas build --platform android --profile development   # requiere eas-cli y sesión
```

> Este proyecto **no** usa `ios/` ni `android/` en el repositorio. Las carpetas nativas se generan con Continuous Native Generation (CNG). No las edites a mano: la configuración vive en `app.json` y en los config plugins.

---

## Variables de entorno

Todas las variables son públicas (`EXPO_PUBLIC_*`) y quedan dentro del bundle. **Nunca pongas secretos.**

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | No | Client ID de la app de Spotify. También se puede pegar en **Ajustes → Spotify** sin recompilar; el valor guardado en el dispositivo tiene prioridad. |
| `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI` | Para Música | Redirect URI **exactamente** registrada en Spotify. Debe ser HTTPS o loopback. |
| `EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL` | Recomendada en móvil | Base del proxy HTTPS que traduce el callback de Spotify al esquema `jeepconnect://`. |
| `EXPO_PUBLIC_TILE_URL_DARK` | No | Plantilla de teselas oscuras. Por defecto CARTO Dark. |
| `EXPO_PUBLIC_TILE_URL_LIGHT` | No | Plantilla de teselas claras. Por defecto CARTO Light. |
| `EXPO_PUBLIC_OSRM_URL` | No | Servidor OSRM. Por defecto el demo público. |
| `EXPO_PUBLIC_NOMINATIM_URL` | No | Servidor Nominatim. Por defecto el público. |
| `EXPO_PUBLIC_RADIO_API_URL` | No | Servidor de Radio Browser. Hay fallbacks automáticos. |

Para compilar con EAS, las variables deben existir en el entorno de build (`eas env:create`) o en `eas.json`. Un `.env` local no se sube a EAS.

---

## Integraciones reales y límites

| Servicio | Uso | Credenciales | Límites reales |
| --- | --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | Clima actual, por hora y pronóstico | No | Uso gratuito razonable, sin SLA |
| [Nominatim](https://nominatim.openstreetmap.org/) | Búsqueda y geocodificación inversa | No | Política de uso: User-Agent identificable, máximo ~1 req/s |
| [OSRM demo](https://project-osrm.org/) | Rutas y geometría | No | Servidor de demostración, sin garantías |
| [CARTO basemaps](https://carto.com/basemaps/) | Teselas ráster OSM | No | Atribución obligatoria; para producción usa tu proveedor |
| [Radio Browser](https://www.radio-browser.info/) | Emisoras y búsqueda | No | Servidores comunitarios; pueden fallar o limitar |
| [Spotify Web API](https://developer.spotify.com/) | Búsqueda y control de reproducción | Client ID + OAuth PKCE | Premium para controlar reproducción; modo desarrollo limitado a 5 usuarios; requiere dispositivo activo |

La app **no inventa datos**: si una API falla, muestra error, reintento o estado vacío. No hay respuestas simuladas de clima, radio, rutas ni Spotify.

---

## Scripts

```bash
pnpm run start      # Servidor de desarrollo Expo
pnpm run android    # Abre en Android
pnpm run ios        # Abre en iOS
pnpm run web        # Abre en web
pnpm run typecheck  # tsc --noEmit
pnpm run lint       # expo lint
pnpm run doctor     # expo-doctor
pnpm run build:apk  # EAS Build, perfil preview (APK)
pnpm run build:aab  # EAS Build, perfil production (AAB)
pnpm run build:ios  # EAS Build, perfil production (iOS)
```

---

## Compilar APK y AAB

El proyecto ya incluye `eas.json` con tres perfiles:

- `development`: development client + APK.
- `preview`: APK instalable, distribución interna.
- `production`: AAB para Google Play (e incremento automático de versión).

Pasos:

```bash
# 1. Instala la CLI (una vez)
npm install --global eas-cli

# 2. Inicia sesión
eas login

# 3. Vincula el proyecto (añade el projectId a app.json)
eas init

# 4. Registra las variables públicas en el entorno de build
eas env:create --name EXPO_PUBLIC_SPOTIFY_CLIENT_ID --value "tu_client_id" --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_SPOTIFY_REDIRECT_URI --value "https://tu-proxy.example.com/callback" --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL --value "https://tu-proxy.example.com" --environment preview --visibility plaintext
# Repite con --environment production para el AAB

# 5. APK de prueba
eas build --platform android --profile preview

# 6. AAB para Google Play
eas build --platform android --profile production

# 7. iOS (requiere cuenta Apple Developer y credenciales)
eas build --platform ios --profile production
```

Cuando el build termine, EAS entrega un enlace de descarga. Para instalar un APK en un teléfono Android:

```bash
adb install jeep-connect.apk
```

### Parche rápido del APK (sin Gradle)

Si solo cambió JavaScript/TypeScript, no hace falta compilar todo con Gradle ni volver a EAS. El APK existente puede recibir un bundle Hermes nuevo:

```bash
# 1. Genera el bundle de producción
pnpm exec expo export:embed --platform android --dev false --minify true \
  --entry-file node_modules/expo-router/entry.js \
  --bundle-output build-patch/index.android.bundle.js \
  --assets-dest build-patch/assets

# 2. Compila el bytecode Hermes
node_modules/.pnpm/hermes-compiler@*/node_modules/hermes-compiler/hermesc/win64-bin/hermesc.exe \
  -emit-binary -O -w -out build-patch/index.android.bundle build-patch/index.android.bundle.js

# 3. Reemplaza el bundle, alinea y firma (usa el APK base de dist/)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/patch-apk.ps1
```

El script `scripts/patch-apk.ps1` reemplaza `assets/index.android.bundle`, verifica el hash, ejecuta `zipalign` y firma con `android/app/debug.keystore` (alias `androiddebugkey`, contraseña `android`). El resultado queda en `build-patch/jeep-connect-patched.apk`.

> Este APK usa la firma de depuración. La primera vez hay que desinstalar la versión firmada por EAS; después, los parches se instalan encima conservando los datos.

### Instalar el APK sin cable

1. Descarga el APK desde el enlace de EAS en el teléfono.
2. Abre el archivo y acepta “Instalar apps desconocidas” para el navegador o el gestor de archivos.
3. Confirma la instalación. Si ya existe una versión con otra firma, desinstálala primero.

### Instalar en iPhone o iPad

- Usa el enlace de instalación interna de EAS (requiere registrar el UDID del dispositivo en el perfil de aprovisionamiento).
- O publica en TestFlight con `eas submit --platform ios`.
- No se puede instalar un `.ipa` arbitrario sin firma de Apple.

> **Estado real:** estos comandos no se ejecutaron en este entorno. Hay una sesión de EAS autenticada, pero con permisos de solo lectura (Viewer), sin `projectId` vinculado y sin Android SDK local. No se debe afirmar que existe un APK/AAB hasta que un build con permisos de escritura termine correctamente.

### Firma y versionado

- Android: EAS gestiona el keystore; puedes reutilizar uno propio con `eas credentials`.
- iOS: EAS gestiona certificados y provisioning profiles.
- `appVersionSource: "remote"` en `eas.json`; `production` usa `autoIncrement`.
- Bundle IDs actuales: `com.jeepconnect.app` (Android) y `com.jeepconnect.app` (iOS). Cámbialos antes de publicar si el nombre entra en conflicto.

---

## Persistencia

Se guarda en el dispositivo, sin backend propio:

| Dato | Almacenamiento |
| --- | --- |
| Tema, unidades, volumen, ecualizador, estilo de mapa, layout | AsyncStorage |
| Client ID de Spotify pegado en Ajustes | AsyncStorage (dato público) |
| Última ubicación manual y preferencias de ubicación | AsyncStorage |
| Favoritos de radio, lugares e historial (máx. 60) | AsyncStorage |
| Tokens de Spotify | `expo-secure-store` (Keychain/Keystore) |
| Perfil de Spotify no sensible | AsyncStorage |
| Permisos | Sistema operativo |

No hay analytics ni telemetría. Las búsquedas y coordenadas se envían a Nominatim/OSRM/Open-Meteo/Spotify según el uso normal de esas APIs.

---

## Estructura del proyecto

```text
.
├─ assets/                     Iconos, splash y favicon
├─ docs/
│  ├─ SPOTIFY.md               PKCE, proxy HTTPS y dashboard
│  ├─ BLUETOOTH.md             Alcance real de Bluetooth y llamadas
│  └─ MAPLIBRE.md              Ruta de migración a mapas vectoriales
├─ scripts/                    Utilidades de generación de assets
├─ src/
│  ├─ app/                     Rutas de Expo Router
│  │  ├─ (tabs)/               Inicio, Mapa, Radio, Música, Más
│  │  ├─ settings/             Ajustes, Spotify, ubicación, permisos, ecualizador, acerca de
│  │  ├─ auto.tsx              Tablero horizontal
│  │  ├─ apps.tsx              Lanzador de apps
│  │  ├─ history.tsx           Historial unificado
│  │  ├─ weather.tsx           Clima detallado
│  │  ├─ onboarding.tsx        Introducción
│  │  └─ +not-found.tsx        404 en español
│  ├─ components/              UI, mapa, vehículo, clima, reproductor
│  ├─ constants/               Configuración, tema, presets de ecualizador
│  ├─ hooks/                   Reloj, conectividad, reproducción
│  ├─ services/                Open-Meteo, radio, geocodificación, rutas, Spotify
│  ├─ store/                   Contextos de ajustes, biblioteca, ubicación, clima, Spotify, radio
│  └─ utils/                   Formato, HTTP, geo, códigos de clima, permisos
├─ app.json                    Configuración Expo + plugins
├─ eas.json                    Perfiles de build
├─ eslint.config.js
└─ tsconfig.json
```

---

## Arte del vehículo

`src/components/vehicle/JeepLiberty.tsx` contiene una ilustración vectorial original del Liberty 2010. Se usa en Inicio, modo automotriz, onboarding y “Acerca de”. No es una foto, un render oficial ni material de Stellantis.

Para sustituirla por una imagen propia:

1. Coloca tu archivo en `assets/` (por ejemplo `assets/jeep-liberty.png`).
2. Reemplaza el componente por un `Image` de `expo-image` conservando las mismas props públicas (`width`, `height`, `bodyColor`, etc.) o adapta las llamadas.
3. Mantén una licencia compatible y atribuye al autor si corresponde.

---

## Limitaciones honestas

- **Bluetooth:** la app no activa Bluetooth, no empareja dispositivos, no realiza llamadas ni simula manos libres. Esas funciones pertenecen al sistema operativo y al vehículo. La interfaz lo comunica explícitamente. Ver [`docs/BLUETOOTH.md`](docs/BLUETOOTH.md).
- **Android Auto / CarPlay:** no se implementa ni se simula proyección. El “modo automotriz” es una pantalla horizontal dentro de la app. Preparar una extensión real exige módulos nativos y cumplir los requisitos de cada plataforma.
- **Ecualizador:** los presets y la banda se guardan, pero no hay procesamiento DSP real porque `expo-audio` no expone ecualización. No se muestra una curva falsa.
- **Mapas:** son teselas ráster, no vectoriales; no hay navegación giro a giro ni mapas offline. `OsmMap` es ligero y multiplataforma. Ver [`docs/MAPLIBRE.md`](docs/MAPLIBRE.md).
- **Spotify:** requiere cuenta y app configurada. En modo desarrollo, el dueño de la app debe tener Premium y solo se admiten 5 usuarios. Controlar la reproducción exige Premium y un dispositivo activo. En móvil, el callback necesita un proxy HTTPS. Ver [`docs/SPOTIFY.md`](docs/SPOTIFY.md).
- **Radio Browser:** depende de servidores comunitarios; algunas emisoras están caídas o usan HTTP. Se habilitó tráfico claro para medios, pero no se puede garantizar disponibilidad.
- **Clima/rutas:** dependen de servicios gratuitos sin SLA. La app maneja errores, pero no puede evitar caídas externas.
- **Builds:** el APK actual se generó con EAS y luego se le parcheó el bundle Hermes localmente (`scripts/patch-apk.ps1`) porque el entorno no permite descargar todas las dependencias de Gradle. Un build completo con Gradle (`:app:assembleRelease`) o EAS sigue siendo la vía recomendada para publicar.

---

## Privacidad

- Sin servidor propio, sin cuentas propias y sin analytics.
- Los tokens de Spotify nunca se escriben en AsyncStorage ni en texto plano.
- El historial y los favoritos se pueden borrar desde la app.
- Las consultas a servicios externos están sujetas a las políticas de cada proveedor.
- La ubicación solo se usa con permiso del usuario; también se puede fijar manualmente.

---

## Documentación

- [`docs/SPOTIFY.md`](docs/SPOTIFY.md) — PKCE, proxy HTTPS, dashboard, límites 2026 y diagnóstico.
- [`docs/BLUETOOTH.md`](docs/BLUETOOTH.md) — qué puede y qué no puede hacer la app.
- [`docs/MAPLIBRE.md`](docs/MAPLIBRE.md) — migración a mapas vectoriales y proveedores de teselas.

---

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).

Las marcas, nombres y logotipos de terceros pertenecen a sus respectivos titulares. El uso de las APIs está sujeto a sus términos y políticas de uso aceptable.
