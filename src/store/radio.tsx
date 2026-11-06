import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RadioStation } from '@/services/radio';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';

type RadioContextValue = {
  station: RadioStation | null;
  queue: RadioStation[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLive: boolean;
  error: string | null;
  playStation: (station: RadioStation, queue?: RadioStation[]) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  dismissError: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { addHistory } = useLibrary();
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [station, setStation] = useState<RadioStation | null>(null);
  const [queue, setQueue] = useState<RadioStation[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stationRef = useRef<RadioStation | null>(null);
  stationRef.current = station;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    }).catch((reason) => console.warn('[audio] setAudioModeAsync', reason));
  }, []);

  useEffect(() => {
    player.volume = Math.max(0, Math.min(1, settings.volume));
  }, [player, settings.volume]);

  useEffect(() => {
    if (!status.error || !stationRef.current) return;
    setError(`No se pudo reproducir «${stationRef.current.name}». La transmisión puede estar fuera de línea.`);
    player.pause();
  }, [player, status.error]);

  const startStation = useCallback(
    (nextStation: RadioStation) => {
      const current = stationRef.current;
      if (current?.id === nextStation.id && status.playing) {
        player.pause();
        return;
      }
      setError(null);
      setStation(nextStation);
      try {
        player.replace(nextStation.url);
        player.volume = Math.max(0, Math.min(1, settings.volume));
        player.play();
        if (nextStation.favicon) {
          player.setActiveForLockScreen(true, {
            title: nextStation.name,
            artist: 'Radio en vivo · Jeep Connect',
            artworkUrl: nextStation.favicon,
          });
        } else {
          player.setActiveForLockScreen(true, {
            title: nextStation.name,
            artist: 'Radio en vivo · Jeep Connect',
          });
        }
        addHistory({
          id: nextStation.id,
          source: 'radio',
          title: nextStation.name,
          subtitle: [nextStation.state, nextStation.country].filter(Boolean).join(', ') || 'Radio en vivo',
          artwork: nextStation.favicon,
          station: nextStation,
        });
      } catch (reason) {
        setError(`No se pudo abrir la transmisión de «${nextStation.name}».`);
        console.warn('[radio] play', reason);
      }
    },
    [addHistory, player, settings.volume, status.playing],
  );

  const playStation = useCallback(
    (nextStation: RadioStation, nextQueue?: RadioStation[]) => {
      const stations = nextQueue?.length ? nextQueue : [nextStation];
      const index = Math.max(0, stations.findIndex((candidate) => candidate.id === nextStation.id));
      setQueue(stations);
      setQueueIndex(index);
      startStation(nextStation);
    },
    [startStation],
  );

  const toggle = useCallback(() => {
    if (!stationRef.current) return;
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

  const stop = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();
  }, [player]);

  const changeStation = useCallback(
    (offset: number) => {
      if (queue.length === 0) return;
      const nextIndex = (queueIndex + offset + queue.length) % queue.length;
      setQueueIndex(nextIndex);
      startStation(queue[nextIndex]);
    },
    [queue, queueIndex, startStation],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      player.volume = clamped;
      updateSettings({ volume: clamped });
    },
    [player, updateSettings],
  );

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      station,
      queue,
      queueIndex,
      isPlaying: Boolean(station) && status.playing,
      isBuffering: Boolean(station) && status.isBuffering,
      isLive: Boolean(station) && status.isLive,
      error,
      playStation,
      toggle,
      stop,
      next: () => changeStation(1),
      previous: () => changeStation(-1),
      setVolume,
      dismissError,
    }),
    [
      station,
      queue,
      queueIndex,
      status.playing,
      status.isBuffering,
      status.isLive,
      error,
      playStation,
      toggle,
      stop,
      changeStation,
      setVolume,
      dismissError,
    ],
  );

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio(): RadioContextValue {
  const context = useContext(RadioContext);
  if (!context) throw new Error('useRadio debe usarse dentro de RadioProvider');
  return context;
}
