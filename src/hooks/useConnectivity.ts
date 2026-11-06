import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';

export type Connectivity = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  isWifi: boolean;
  isCellular: boolean;
  batteryLevel: number | null;
  isCharging: boolean;
  bluetoothEnabled: boolean | null;
  bluetoothNote: string;
};

const BLUETOOTH_NOTE =
  'El Bluetooth lo administra el sistema operativo. Jeep Connect no puede activarlo, emparejar ni simular llamadas.';

export function useConnectivity(): Connectivity {
  const net = useNetInfo();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);

  useEffect(() => {
    let active = true;
    Battery.getBatteryLevelAsync()
      .then((level) => {
        if (active) setBatteryLevel(level >= 0 ? level : null);
      })
      .catch(() => undefined);
    Battery.getBatteryStateAsync()
      .then((state) => {
        if (active) setBatteryState(state);
      })
      .catch(() => undefined);

    const levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      setBatteryLevel(level >= 0 ? level : null);
    });
    const stateSubscription = Battery.addBatteryStateListener(({ batteryState: state }) => {
      setBatteryState(state);
    });

    return () => {
      active = false;
      levelSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  // NetInfo puede tardar en entregar el primer estado; forzamos una lectura.
  useEffect(() => {
    NetInfo.fetch().catch(() => undefined);
  }, []);

  const type = net.type ?? 'unknown';
  return {
    isConnected: Boolean(net.isConnected),
    isInternetReachable: net.isInternetReachable,
    connectionType: type,
    isWifi: type === 'wifi' || type === 'ethernet',
    isCellular: type === 'cellular',
    batteryLevel,
    isCharging:
      batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
    bluetoothEnabled: null,
    bluetoothNote: BLUETOOTH_NOTE,
  };
}

export function connectivityLabel(connectionType: string): string {
  switch (connectionType) {
    case 'wifi':
      return 'Wi-Fi';
    case 'ethernet':
      return 'Ethernet';
    case 'cellular':
      return 'Datos móviles';
    case 'none':
      return 'Sin conexión';
    default:
      return 'Red desconocida';
  }
}
