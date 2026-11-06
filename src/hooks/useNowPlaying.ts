import { useCallback, useMemo } from 'react';
import { useRadio } from '@/store/radio';
import { useSettings } from '@/store/settings';
import { useSpotify } from '@/store/spotify';

export type NowPlayingSource = 'radio' | 'spotify' | null;

export type NowPlaying = {
  source: NowPlayingSource;
  sourceLabel: string;
  title: string;
  subtitle: string;
  artwork: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isLive: boolean;
  progressMs: number;
  durationMs: number;
  canSeek: boolean;
  canNext: boolean;
  canPrevious: boolean;
  volume: number;
  error: string | null;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (positionMs: number) => void;
  setVolume: (value: number) => void;
};

/**
 * Une la radio local y Spotify en una sola tarjeta de reproducción.
 * La radio tiene prioridad mientras suena; si está en pausa, Spotify manda.
 */
export function useNowPlaying(): NowPlaying {
  const radio = useRadio();
  const spotify = useSpotify();
  const { settings, updateSettings } = useSettings();

  const radioActive = Boolean(radio.station && (radio.isPlaying || radio.isBuffering));
  const spotifyItem = spotify.playback?.item ?? null;
  const source: NowPlayingSource = radioActive ? 'radio' : spotifyItem ? 'spotify' : radio.station ? 'radio' : null;

  const radioStation = radio.station;

  const toggle = useCallback(() => {
    if (source === 'radio') radio.toggle();
    else if (source === 'spotify') void spotify.togglePlayback().catch(() => undefined);
  }, [radio, source, spotify]);

  const next = useCallback(() => {
    if (source === 'radio') radio.next();
    else if (source === 'spotify') void spotify.next().catch(() => undefined);
  }, [radio, source, spotify]);

  const previous = useCallback(() => {
    if (source === 'radio') radio.previous();
    else if (source === 'spotify') void spotify.previous().catch(() => undefined);
  }, [radio, source, spotify]);

  const seek = useCallback(
    (positionMs: number) => {
      if (source === 'spotify') void spotify.seek(positionMs).catch(() => undefined);
    },
    [source, spotify],
  );

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(1, value));
      radio.setVolume(clamped);
      updateSettings({ volume: clamped });
      if (source === 'spotify') {
        void spotify.setVolume(clamped * 100).catch(() => undefined);
      }
    },
    [radio, source, spotify, updateSettings],
  );

  return useMemo(() => {
    if (source === 'radio' && radioStation) {
      return {
        source,
        sourceLabel: 'Radio en vivo',
        title: radioStation.name,
        subtitle:
          [radioStation.state, radioStation.country].filter(Boolean).join(', ') || 'Transmisión en vivo',
        artwork: radioStation.favicon,
        isPlaying: radio.isPlaying,
        isBuffering: radio.isBuffering,
        isLive: true,
        progressMs: 0,
        durationMs: 0,
        canSeek: false,
        canNext: radio.queue.length > 1,
        canPrevious: radio.queue.length > 1,
        volume: settings.volume,
        error: radio.error,
        toggle,
        next,
        previous,
        seek,
        setVolume,
      };
    }

    if (source === 'spotify' && spotifyItem) {
      const playback = spotify.playback;
      const progress = playback?.progress_ms ?? 0;
      return {
        source,
        sourceLabel: playback?.device?.name ? `Spotify · ${playback.device.name}` : 'Spotify',
        title: spotifyItem.name,
        subtitle: spotifyItem.artists.map((artist) => artist.name).join(', '),
        artwork: spotifyItem.album.images[0]?.url ?? null,
        isPlaying: Boolean(playback?.is_playing),
        isBuffering: spotify.pendingAction === 'play' || spotify.pendingAction === 'toggle',
        isLive: false,
        progressMs: progress,
        durationMs: spotifyItem.duration_ms,
        canSeek: !spotify.isFree,
        canNext: true,
        canPrevious: true,
        volume: settings.volume,
        error: spotify.error,
        toggle,
        next,
        previous,
        seek,
        setVolume,
      };
    }

    return {
      source: null,
      sourceLabel: 'Sin reproducción',
      title: 'Nada suena todavía',
      subtitle: 'Elige una estación de radio o una canción de Spotify.',
      artwork: null,
      isPlaying: false,
      isBuffering: false,
      isLive: false,
      progressMs: 0,
      durationMs: 0,
      canSeek: false,
      canNext: false,
      canPrevious: false,
      volume: settings.volume,
      error: null,
      toggle,
      next,
      previous,
      seek,
      setVolume,
    };
  }, [
    source,
    radioStation,
    radio.isPlaying,
    radio.isBuffering,
    radio.queue.length,
    radio.error,
    spotifyItem,
    spotify.playback,
    spotify.pendingAction,
    spotify.error,
    spotify.isFree,
    settings.volume,
    toggle,
    next,
    previous,
    seek,
    setVolume,
  ]);
}
