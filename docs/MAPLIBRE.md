# Mapas: implementación actual y migración a MapLibre

JEEP CONNECT usa un mapa propio, ligero y sin claves: `src/components/map/OsmMap.tsx`. Este documento explica cómo funciona, sus límites y cómo migrar a teselas vectoriales con MapLibre si necesitas más rendimiento, rotación, edificios 3D o mapas offline.

---

## 1. Implementación actual

`OsmMap` se construye con:

- **Teselas ráster** de 256 px de CARTO (OSM) en dos estilos: `dark_all` y `light_all`.
- `expo-image` para descargar y cachear cada tesela en disco.
- `react-native-gesture-handler` para pan y pinch-zoom.
- `react-native-svg` para dibujar la ruta (polilínea) y los marcadores.
- Proyección Web Mercator propia en `src/utils/geo.ts`.
- Atribución visible a OpenStreetMap y CARTO.

No usa WebView, ni un SDK de mapas nativo, ni una API key. Esto permite que funcione en Expo Go y mantiene el bundle pequeño.

### Variables de teselas

```dotenv
EXPO_PUBLIC_TILE_URL_DARK=https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
EXPO_PUBLIC_TILE_URL_LIGHT=https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png
```

Cualquier proveedor que sirva teselas XYZ puede usarse cambiando la plantilla. Debes respetar sus términos, cuotas y atribución.

### Rutas y búsqueda

- **Nominatim** para buscar lugares y geocodificación inversa.
- **OSRM** para calcular ruta, distancia, duración y geometría.
- El demo público de OSRM y el Nominatim público son servicios de mejor esfuerzo. Para producción, aloja los tuyos o contrata un proveedor.

---

## 2. Límites actuales

| Limitación | Impacto |
| --- | --- |
| Teselas ráster | No hay rotación, inclinación, edificios 3D ni estilos vectoriales |
| Sin caché offline gestionada | Solo caché de disco de `expo-image`; no hay descarga de regiones |
| Sin navegación giro a giro | Se muestra la ruta, pero no hay instrucciones ni voz |
| Pan/pinch en JS | En teléfonos muy lentos puede sentirse menos fluido que un motor nativo |
| Politica de uso de CARTO/OSM | No apto para tráfico masivo sin proveedor propio |
| Sin clustering | Muchos marcadores se dibujan uno a uno |

Si la app se queda en un teléfono/tablet personal con poco tráfico, la implementación actual es suficiente y mucho más simple de mantener.

---

## 3. Cuándo migrar a MapLibre

Migra si necesitas:

- Teselas vectoriales con estilos personalizados (colores de Jeep Connect).
- Rotación, inclinación y edificios 3D.
- Mapas offline por región.
- Mejor rendimiento con miles de marcadores o rutas largas.
- Navegación giro a giro con instrucciones.

No migres solo por “modernidad”: MapLibre añade un módulo nativo, un development build obligatorio y posibles claves de proveedor.

---

## 4. Migración paso a paso

### Paso 1: elegir proveedor de teselas vectoriales

| Proveedor | Clave | Notas |
| --- | --- | --- |
| [MapTiler](https://www.maptiler.com/) | Sí | Estilos listos, plan gratuito con límites, términos comerciales |
| [Stadia Maps](https://stadiamaps.com/) | Sí | Estilos oscuros/claros, buena documentación |
| [Protomaps](https://protomaps.com/) | No si autoalojas | PMTiles; puedes servir tu propio archivo |
| [OpenFreeMap](https://openfreemap.org/) | No | Estilos y teselas abiertas; revisa capacidad y términos |
| Servidor propio | No | Requiere infraestructura y extracción de datos OSM |

No uses el tile server comunitario de OpenStreetMap para teselas vectoriales masivas ni para producción.

### Paso 2: instalar MapLibre

```bash
npm install @maplibre/maplibre-react-native
npx expo prebuild
npx expo run:android   # o eas build --profile development
```

Consulta la guía oficial de Expo/MapLibre para la versión exacta y el config plugin:

- <https://maplibre.org/maplibre-react-native/docs/setup/expo/>
- <https://docs.expo.dev/develop/development-builds/introduction/>

MapLibre **no funciona en Expo Go**: es un módulo nativo. Necesitas un development build o un binario compilado.

### Paso 3: configurar el estilo

```ts
// src/constants/mapStyle.ts
export const MAP_STYLE_DARK = 'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=TU_CLAVE';
export const MAP_STYLE_LIGHT = 'https://api.maptiler.com/maps/streets-v2/style.json?key=TU_CLAVE';
```

Guarda la clave en `EXPO_PUBLIC_MAPTILER_KEY` o en un proxy propio. Recuerda que `EXPO_PUBLIC_*` es pública.

### Paso 4: reemplazar `OsmMap`

Mantén la misma interfaz pública para no tocar las pantallas:

```ts
export type MapMarker = {
  id: string;
  coordinate: Coordinate;
  kind?: 'origin' | 'destination' | 'place' | 'user';
  label?: string;
};
```

Un componente MapLibre mínimo:

```tsx
import MapLibreGL from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';

MapLibreGL.setAccessToken(null);

export function MapLibreMap({ center, zoom, markers, route, dark }: Props) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapLibreGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
        logoEnabled={false}
        attributionEnabled
      >
        <MapLibreGL.Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={zoom}
        />
        {route?.length ? (
          <MapLibreGL.ShapeSource
            id="route"
            shape={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.map((p) => [p.longitude, p.latitude]) } }}
          >
            <MapLibreGL.LineLayer id="route-line" style={{ lineColor: '#79C7FF', lineWidth: 4 }} />
          </MapLibreGL.ShapeSource>
        ) : null}
        {markers.map((marker) => (
          <MapLibreGL.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
          />
        ))}
      </MapLibreGL.MapView>
    </View>
  );
}
```

La API exacta cambia entre versiones; verifica los nombres en la documentación instalada. Mantén el `OsmMap` actual como fallback si quieres una versión web o de bajo consumo.

### Paso 5: permisos y app.json

MapLibre suele requerir configuración nativa adicional (por ejemplo, `NSLocationWhenInUseUsageDescription` ya está cubierta por `expo-location`). Revisa el config plugin de MapLibre y vuelve a generar `ios/` y `android/` con `npx expo prebuild --clean`.

### Paso 6: verificar

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform android
npx eas-cli build --platform android --profile development
```

Prueba en un dispositivo real: gestos, rotación, memoria, consumo de batería y descarga de teselas.

---

## 5. Mapas offline

Con MapLibre puedes descargar paquetes de teselas por región. Considera:

- Tamaño: una ciudad puede ocupar cientos de MB.
- Licencia: algunos proveedores prohíben almacenar teselas.
- Actualización: los paquetes caducan.
- Almacenamiento: pide confirmación al usuario y permite borrar.

La app actual no descarga regiones; no prometas offline hasta implementarlo y probarlo.

---

## 6. Atribución y cumplimiento

Aunque cambies de proveedor, debes mostrar:

- “© OpenStreetMap contributors”.
- La atribución del proveedor de teselas (CARTO, MapTiler, Stadia, etc.).
- Un enlace o texto accesible cuando la licencia lo exija.

La constante `MAP.attribution` ya se muestra en `OsmMap`. Si migras, conserva una atribución equivalente.

---

## 7. Recomendación

1. **Uso personal / un solo vehículo:** mantén `OsmMap` con CARTO. Es simple, sin claves y suficiente.
2. **Distribución pública:** cambia a un proveedor con términos comerciales o autoaloja teselas. Revisa las políticas de Nominatim y OSRM; idealmente usa instancias propias.
3. **Navegación real:** migra a MapLibre + un motor de rutas con instrucciones (OSRM + Valhalla/GraphHopper) y asume el coste de un development build.
