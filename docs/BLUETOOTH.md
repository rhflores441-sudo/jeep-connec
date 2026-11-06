# Bluetooth, llamadas y proyección

Este documento describe el alcance **real** de JEEP CONNECT en materia de Bluetooth, telefonía y proyección, y qué haría falta para ampliarlo sin simular funciones que el sistema operativo no permite.

---

## 1. Qué hace la app hoy

- Muestra una tarjeta informativa de Bluetooth en Inicio, Más y Permisos.
- Explica que el Bluetooth lo administra el sistema operativo.
- **No** activa el adaptador.
- **No** empareja dispositivos.
- **No** lista dispositivos Bluetooth.
- **No** realiza ni recibe llamadas.
- **No** simula manos libres, contactos, marcador ni audio de llamada.
- **No** muestra un estado de “conectado” inventado: el hook `useConnectivity` devuelve `bluetoothEnabled: null` y una nota explícita.

La razón es deliberada: sin un módulo nativo y permisos en tiempo de ejecución, cualquier indicador de “Bluetooth conectado” sería ficticio. La app prefiere ser honesta.

---

## 2. Qué permite cada plataforma

### Android

| Capacidad | ¿Se puede? | Requisitos |
| --- | --- | --- |
| Consultar si Bluetooth está activado | Sí | `BLUETOOTH_CONNECT` (Android 12+) o `BLUETOOTH` (versiones antiguas) |
| Listar dispositivos emparejados | Sí, con permiso | `BLUETOOTH_CONNECT` |
| Descubrir dispositivos BLE | Sí | `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, ubicación en versiones antiguas |
| Emparejar clásico | Limitado | Intents del sistema; el usuario confirma |
| Perfil manos libres (HFP) | No desde la app | Lo gestiona el stack de telefonía del sistema/vehículo |
| Realizar llamadas | Solo abrir el marcador | `Intent.ACTION_DIAL`; requiere interacción del usuario |
| Android Auto | Solo con app/extensión compatible | Requisitos de Google, categorías y revisión |

### iOS

| Capacidad | ¿Se puede? | Requisitos |
| --- | --- | --- |
| Consultar Bluetooth | Parcial | CoreBluetooth solo expone BLE, no el estado clásico |
| Listar dispositivos Bluetooth clásicos | No | CoreBluetooth no expone audio clásico/HFP |
| Emparejar auriculares/manos libres | No programáticamente | El usuario lo hace en Ajustes |
| Llamadas | No | No hay API pública para iniciar llamadas ni acceder al registro |
| CarPlay | Solo con entitlement y app de navegación/audio aprobada | Apple debe aprobar; no se simula |

**Conclusión:** “Bluetooth del vehículo” y “llamadas” pertenecen al sistema operativo y al estéreo del automóvil. Una app de terceros no puede controlarlos de forma genérica, y menos aún en Expo Go.

---

## 3. Por qué no se agregó `react-native-ble-plx`

Se evaluó, pero:

1. Solo cubre **BLE**, no Bluetooth clásico ni HFP.
2. Requiere un development build (no funciona en Expo Go).
3. Añade permisos sensibles y un escaneo que la app no necesita para su propósito actual.
4. No resuelve llamadas ni audio del vehículo.
5. Mostrar un escaneo sin utilidad real sería más ruido que valor.

La arquitectura queda preparada: si en el futuro se integra un módulo BLE, el estado debe venir de una fuente real y la UI debe seguir distinguiendo “no disponible” de “desconectado”.

---

## 4. Si se implementa Bluetooth en el futuro

### Paso 1: elegir el caso de uso

- ¿Leer sensores BLE del vehículo (temperatura, batería, OBD-II)?
- ¿Detectar una bocina o manos libres?
- ¿Abrir ajustes del sistema?

Cada caso exige un módulo distinto. No existe un “Bluetooth universal” en React Native.

### Paso 2: development build

```bash
npx expo install react-native-ble-plx
npx expo prebuild
npx expo run:android   # requiere SDK
# o
npx eas-cli build --platform android --profile development
```

### Paso 3: permisos Android

En `app.json`:

```json
{
  "android": {
    "permissions": [
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT"
    ]
  }
}
```

Para Android 11 o anterior, además:

```json
"android.permission.BLUETOOTH",
"android.permission.BLUETOOTH_ADMIN",
"android.permission.ACCESS_FINE_LOCATION"
```

Solicita los permisos en tiempo de ejecución y explica por qué. No escanees en segundo plano sin necesidad.

### Paso 4: iOS

Agrega `NSBluetoothAlwaysUsageDescription` en `app.json` → `ios.infoPlist`. CoreBluetooth solo verá BLE; no prometas manos libres.

### Paso 5: UI honesta

- “Bluetooth desactivado” (estado del sistema).
- “Permiso denegado”.
- “Adaptador no disponible”.
- “Buscando…” solo mientras haya un escaneo activo.
- “Conectado a X” solo con una conexión BLE real y verificada.

Nunca derives el estado de una variable local o de un temporizador.

---

## 5. Llamadas y marcador

Lo máximo razonable desde React Native es abrir el marcador del sistema con el número precargado:

```ts
import { Linking } from 'react-native';

// Android
await Linking.sendIntent('android.intent.action.DIAL', [{ key: 'data', value: 'tel:+525555555555' }]);

// iOS
await Linking.openURL('tel:+525555555555');
```

Esto **no** inicia la llamada sin confirmación y **no** da acceso al audio ni a los contactos. La app actual no incluye marcador para no aparentar una integración telefónica que no existe.

---

## 6. Android Auto y CarPlay

- **No** se implementa proyección.
- **No** se simula una pantalla de auto.
- El “modo automotriz” (`src/app/auto.tsx`) es una composición horizontal **dentro de la app**, pensada para un teléfono o tablet montado en el tablero.
- Para Android Auto real se necesita una app Android con el SDK de Android Auto, categoría válida (audio/navegación/mensajería), revisión de Google y un módulo nativo fuera del alcance de Expo Go.
- Para CarPlay se necesita el entitlement de Apple, una app aprobada y Xcode/macOS.

Mantener esta separación evita promesas falsas y cumple las políticas de ambas plataformas.

---

## 7. Resumen para el usuario

- El Bluetooth del teléfono y del estéreo se configura en **Ajustes del sistema**.
- Las llamadas se realizan desde el teléfono o el sistema del vehículo.
- Jeep Connect se enfoca en clima, mapas, radio, música y estado del viaje.
- Cualquier función futura de Bluetooth deberá basarse en hardware real y permisos concedidos.
