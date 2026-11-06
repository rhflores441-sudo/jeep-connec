import { Image } from 'expo-image';
import {
  CircleAlert,
  Disc3,
  KeyRound,
  ListMusic,
  LogOut,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { useSpotify } from '@/store/spotify';
import {
  formatSpotifyDuration,
  playlistTrackCount,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from '@/services/spotify';
import { errorMessage } from '@/utils/http';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { PlayerCard } from '@/components/player/PlayerCard';

export default function MusicScreen() {
  const { colors, isDark } = useTheme();
  const spotify = useSpotify();
  const { loadPlaylists, search, syncPlayback } = spotify;

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const connected = spotify.status === 'connected';
  const planLabel = spotify.isPremium ? 'PREMIUM' : spotify.isFree ? 'FREE' : 'CUENTA';
  const planTone = spotify.isPremium ? 'green' : spotify.isFree ? 'amber' : 'accent';
  const planBackground = spotify.isPremium
    ? colors.greenSoft
    : spotify.isFree
      ? colors.amberSoft
      : colors.accentSoft;

  useEffect(() => {
    if (!connected) {
      setTracks([]);
      setPlaylists([]);
      return;
    }
    let active = true;
    setPlaylistsLoading(true);
    setPlaylistsError(null);
    loadPlaylists()
      .then((found) => {
        if (active) setPlaylists(found.filter((playlist) => playlist && playlist.id));
      })
      .catch((reason) => {
        if (active) setPlaylistsError(errorMessage(reason, 'No fue posible cargar tus playlists.'));
      })
      .finally(() => {
        if (active) setPlaylistsLoading(false);
      });
    void syncPlayback();
    return () => {
      active = false;
    };
  }, [connected, loadPlaylists, syncPlayback]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!connected || trimmed.length < 2) {
      setTracks([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      search(trimmed, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setTracks(results.tracks.filter((track) => track && track.id));
          setSearchError(null);
        })
        .catch((reason) => {
          if (controller.signal.aborted) return;
          setTracks([]);
          setSearchError(errorMessage(reason, 'No fue posible buscar en Spotify.'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 550);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, connected, search]);

  const runAction = useCallback(async (operation: () => Promise<void>, fallback: string) => {
    setActionError(null);
    try {
      await operation();
    } catch (reason) {
      setActionError(errorMessage(reason, fallback));
    }
  }, []);

  const handleConnect = async () => {
    setActionError(null);
    await spotify.connect();
  };

  const handleDisconnect = () => {
    Alert.alert('Desconectar Spotify', 'Se borrarán los tokens guardados en este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: () => {
          void spotify.disconnect();
        },
      },
    ]);
  };

  const handleTrack = (track: SpotifyTrack) => {
    void runAction(() => spotify.playTrack(track), 'Spotify no pudo reproducir esta canción.');
  };

  const handlePlaylist = (playlist: SpotifyPlaylist) => {
    void runAction(() => spotify.playPlaylist(playlist), 'Spotify no pudo reproducir esta playlist.');
  };

  const errorBanner = actionError ?? spotify.error;

  return (
    <Screen tabInset>
      <Header
        title="Música"
        subtitle="Spotify · Control real de reproducción"
        showBack={false}
        right={
          connected ? (
            <View style={styles.headerActions}>
              <IconButton
                icon={RefreshCw}
                label="Sincronizar con Spotify"
                onPress={() => void spotify.syncPlayback()}
              />
              <IconButton icon={LogOut} label="Desconectar Spotify" onPress={handleDisconnect} />
            </View>
          ) : (
            <IconButton
              icon={Settings}
              label="Ajustes de Spotify"
              onPress={() => router.push('/settings/spotify')}
            />
          )
        }
      />

      {!spotify.configured ? (
        <Card>
          <View style={styles.setupHead}>
            <View style={[styles.setupIcon, { backgroundColor: colors.greenSoft }]}>
              <Disc3 size={24} color={colors.green} />
            </View>
            <View style={styles.setupText}>
              <AppText variant="subtitle">Conecta Spotify</AppText>
              <AppText variant="caption" color="muted">
                Jeep Connect usa la Web API oficial con PKCE. No hay backend propio ni contraseñas
                almacenadas.
              </AppText>
            </View>
          </View>
          <View style={styles.steps}>
            <Step number="1" title="Crea una app en Spotify for Developers" text="Copia el Client ID." />
            <Step
              number="2"
              title="Registra la Redirect URI"
              text="Debe ser HTTPS o loopback. Un esquema jeepconnect:// no lo acepta Spotify."
            />
            <Step
              number="3"
              title="Añade EXPO_PUBLIC_SPOTIFY_CLIENT_ID"
              text="En el archivo .env y reinicia el servidor de Expo."
            />
          </View>
          <PressableScale
            onPress={() => router.push('/settings/spotify')}
            scaleTo={0.97}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          >
            <KeyRound size={17} color={colors.white} />
            <AppText variant="bodyStrong" color="white">
              Ver configuración
            </AppText>
          </PressableScale>
        </Card>
      ) : !connected ? (
        <Card>
          <View style={styles.setupHead}>
            <View style={[styles.setupIcon, { backgroundColor: colors.greenSoft }]}>
              <Disc3 size={24} color={colors.green} />
            </View>
            <View style={styles.setupText}>
              <AppText variant="subtitle">
                {spotify.status === 'initializing'
                  ? 'Restaurando sesión…'
                  : spotify.status === 'connecting'
                    ? 'Conectando con Spotify…'
                    : 'Conecta tu cuenta'}
              </AppText>
              <AppText variant="caption" color="muted">
                Busca canciones y playlists, y controla la reproducción en un dispositivo activo. Para
                controlar la reproducción se requiere Spotify Premium.
              </AppText>
            </View>
          </View>

          {!spotify.redirectCompatible ? (
            <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
              <CircleAlert size={16} color={colors.amber} />
              <AppText variant="caption" color="amber" style={styles.warningText}>
                La Redirect URI actual ({spotify.redirectUri}) no es HTTPS. Spotify la rechazará. Configura
                una URI HTTPS segura; consulta Ajustes → Spotify.
              </AppText>
            </View>
          ) : Platform.OS !== 'web' && !spotify.proxyConfigured ? (
            <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
              <CircleAlert size={16} color={colors.amber} />
              <AppText variant="caption" color="amber" style={styles.warningText}>
                Falta el proxy HTTPS. Spotify no acepta el esquema jeepconnect:// y el navegador no
                podrá devolver el código a la app. Configúralo en Ajustes → Spotify.
              </AppText>
            </View>
          ) : null}

          {spotify.error ? (
            <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
              <CircleAlert size={16} color={colors.danger} />
              <AppText variant="caption" color="danger" style={styles.warningText}>
                {spotify.error}
              </AppText>
            </View>
          ) : null}

          <PressableScale
            onPress={() => void handleConnect()}
            disabled={spotify.status === 'connecting' || spotify.status === 'initializing'}
            scaleTo={0.97}
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.green,
                opacity: spotify.status === 'connecting' || spotify.status === 'initializing' ? 0.6 : 1,
              },
            ]}
          >
            {spotify.status === 'connecting' || spotify.status === 'initializing' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <User size={17} color={colors.white} />
            )}
            <AppText variant="bodyStrong" color="white">
              {spotify.status === 'connecting' ? 'Abriendo Spotify…' : 'Conectar con Spotify'}
            </AppText>
          </PressableScale>

          <PressableScale
            onPress={() => router.push('/settings/spotify')}
            scaleTo={0.98}
            accessibilityRole="button"
            style={styles.linkButton}
          >
            <AppText variant="caption" color="accent">
              Ver detalles de configuración y Redirect URI
            </AppText>
          </PressableScale>
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                {spotify.profile?.images?.[0]?.url ? (
                  <Image
                    source={{ uri: spotify.profile.images[0].url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={180}
                    cachePolicy="disk"
                  />
                ) : (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <User size={22} color={colors.accent} />
                  </View>
                )}
              </View>
              <View style={styles.profileText}>
                <AppText variant="subtitle" numberOfLines={1}>
                  {spotify.profile?.display_name ?? 'Cuenta de Spotify'}
                </AppText>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {spotify.profile?.email ?? `Cuenta ${spotify.profile?.id ?? 'conectada'}`}
                </AppText>
              </View>
              <View style={[styles.planBadge, { backgroundColor: planBackground }]}>
                {spotify.isPremium ? (
                  <Sparkles size={12} color={colors.green} />
                ) : (
                  <ShieldCheck size={12} color={colors[planTone]} />
                )}
                <AppText variant="micro" color={planTone} style={styles.planText}>
                  {planLabel}
                </AppText>
              </View>
            </View>

            {spotify.isFree ? (
              <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
                <CircleAlert size={16} color={colors.amber} />
                <AppText variant="caption" color="amber" style={styles.warningText}>
                  Tu cuenta es Free. Puedes buscar y ver playlists, pero Spotify exige Premium para iniciar,
                  pausar o cambiar de canción desde la app.
                </AppText>
              </View>
            ) : null}
          </Card>

          {spotify.playback?.item ? (
            <View style={styles.player}>
              <PlayerCard compact />
            </View>
          ) : (
            <Card style={styles.idleCard}>
              <View style={styles.idleRow}>
                <View style={[styles.idleIcon, { backgroundColor: colors.accentSoft }]}>
                  <ListMusic size={19} color={colors.accent} />
                </View>
                <View style={styles.idleText}>
                  <AppText variant="bodyStrong">Sin reproducción activa</AppText>
                  <AppText variant="caption" color="muted">
                    Abre Spotify en algún dispositivo, reproduce algo una vez y vuelve aquí. Así Jeep
                    Connect puede transferir la reproducción.
                  </AppText>
                </View>
              </View>
            </Card>
          )}

          {errorBanner ? (
            <View style={[styles.warning, { backgroundColor: colors.dangerSoft, marginTop: spacing.md }]}>
              <CircleAlert size={16} color={colors.danger} />
              <AppText variant="caption" color="danger" style={styles.warningText}>
                {errorBanner}
              </AppText>
              <PressableScale
                onPress={() => {
                  setActionError(null);
                  spotify.clearError();
                }}
                scaleTo={0.9}
                accessibilityRole="button"
              >
                <AppText variant="micro" color="muted">
                  CERRAR
                </AppText>
              </PressableScale>
            </View>
          ) : null}

          <View style={styles.search}>
            <TextField
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder="Buscar canciones en Spotify"
              right={searching ? <ActivityIndicator size="small" color={colors.accent} /> : undefined}
            />
          </View>

          {query.trim().length >= 2 ? (
            <View style={styles.searchSection}>
              <View style={styles.sectionRow}>
                <AppText variant="micro" color="muted" style={styles.sectionKicker}>
                  RESULTADOS
                </AppText>
                {!searching && tracks.length > 0 ? (
                  <AppText variant="caption" color="muted">
                    {tracks.length} canciones
                  </AppText>
                ) : null}
              </View>
              {searching && tracks.length === 0 ? (
                <LoadingState label="Buscando en Spotify…" compact />
              ) : searchError ? (
                <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
                  <CircleAlert size={16} color={colors.danger} />
                  <AppText variant="caption" color="danger" style={styles.warningText}>
                    {searchError}
                  </AppText>
                </View>
              ) : tracks.length === 0 ? (
                <EmptyState
                  icon={Disc3}
                  title="Sin canciones"
                  message="Prueba con otro título o artista."
                  compact
                />
              ) : (
                <Card padded={false}>
                  <View style={styles.list}>
                    {tracks.map((track, index) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        last={index === tracks.length - 1}
                        busy={spotify.pendingAction === 'play'}
                        onPress={() => handleTrack(track)}
                      />
                    ))}
                  </View>
                </Card>
              )}
            </View>
          ) : (
            <View style={styles.searchSection}>
              <View style={styles.sectionRow}>
                <AppText variant="micro" color="muted" style={styles.sectionKicker}>
                  TUS PLAYLISTS
                </AppText>
                {playlistsLoading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
              </View>
              {playlistsError ? (
                <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
                  <CircleAlert size={16} color={colors.danger} />
                  <AppText variant="caption" color="danger" style={styles.warningText}>
                    {playlistsError}
                  </AppText>
                </View>
              ) : playlistsLoading && playlists.length === 0 ? (
                <LoadingState label="Cargando playlists…" compact />
              ) : playlists.length === 0 ? (
                <EmptyState
                  icon={ListMusic}
                  title="Sin playlists"
                  message="Crea una playlist en Spotify y aparecerá aquí."
                  compact
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.playlists}
                >
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onPress={() => handlePlaylist(playlist)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={[styles.note, { backgroundColor: isDark ? colors.surface : colors.surfaceHigh }]}>
            <ShieldCheck size={15} color={colors.green} />
            <AppText variant="micro" color="muted" style={styles.noteText}>
              LOS TOKENS SE GUARDAN CIFRADOS CON SECURESTORE. EL CONTROL DE REPRODUCCIÓN RESPETA LOS
              LÍMITES DE SPOTIFY Y REQUIERE UN DISPOSITIVO ACTIVO.
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}>
        <AppText variant="micro" color="accent">
          {number}
        </AppText>
      </View>
      <View style={styles.stepText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="muted">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function TrackRow({
  track,
  onPress,
  busy,
  last,
}: {
  track: SpotifyTrack;
  onPress: () => void;
  busy: boolean;
  last: boolean;
}) {
  const { colors } = useTheme();
  const image = track.album.images[0]?.url;
  return (
    <PressableScale
      onPress={onPress}
      disabled={busy}
      scaleTo={0.99}
      accessibilityRole="button"
      style={[
        styles.trackRow,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={styles.trackArtwork}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={160}
            cachePolicy="disk"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
            ]}
          >
            <Disc3 size={18} color={colors.accent} />
          </View>
        )}
      </View>
      <View style={styles.trackText}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {track.name}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {track.artists.map((artist) => artist.name).join(', ')} · {track.album.name}
        </AppText>
      </View>
      <AppText variant="caption" color="muted" style={styles.trackDuration}>
        {formatSpotifyDuration(track.duration_ms)}
      </AppText>
      <View style={[styles.trackPlay, { backgroundColor: colors.accentSoft }]}>
        {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Play size={15} color={colors.accent} fill={colors.accent} />}
      </View>
    </PressableScale>
  );
}

function PlaylistCard({ playlist, onPress }: { playlist: SpotifyPlaylist; onPress: () => void }) {
  const { colors } = useTheme();
  const image = playlist.images[0]?.url;
  const trackCount = playlistTrackCount(playlist);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={`Reproducir ${playlist.name}`}
      style={styles.playlistCard}
    >
      <View style={[styles.playlistArtwork, { backgroundColor: colors.accentSoft }]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={180}
            cachePolicy="disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <ListMusic size={24} color={colors.accent} />
          </View>
        )}
        <View style={[styles.playlistPlay, { backgroundColor: colors.accent }]}>
          <Play size={14} color={colors.white} fill={colors.white} />
        </View>
      </View>
      <AppText variant="caption" font="semibold" numberOfLines={1} style={styles.playlistName}>
        {playlist.name}
      </AppText>
      <AppText variant="micro" color="muted" numberOfLines={1}>
        {trackCount === null ? 'PLAYLIST' : `${trackCount} CANCIONES`}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  setupHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  setupIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  setupText: { flex: 1, gap: 2 },
  steps: { gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNumber: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 1 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  linkButton: { alignItems: 'center', paddingVertical: 12 },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  warningText: { flex: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  profileText: { flex: 1, gap: 1 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  planText: { fontSize: 8.5, letterSpacing: 0.8 },
  player: { marginTop: spacing.lg },
  idleCard: { marginTop: spacing.lg },
  idleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  idleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  idleText: { flex: 1, gap: 2 },
  search: { marginTop: spacing.lg },
  searchSection: { marginTop: spacing.lg, gap: spacing.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionKicker: { letterSpacing: 1.3 },
  list: { paddingHorizontal: spacing.lg },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  trackArtwork: { width: 46, height: 46, borderRadius: 10, overflow: 'hidden' },
  trackText: { flex: 1, gap: 2 },
  trackDuration: { fontVariant: ['tabular-nums'] },
  trackPlay: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  playlists: { gap: spacing.md, paddingVertical: spacing.xs },
  playlistCard: { width: 138, gap: 5 },
  playlistArtwork: { width: 138, height: 138, borderRadius: radius.lg, overflow: 'hidden' },
  playlistPlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistName: { marginTop: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  noteText: { flex: 1, fontSize: 9, letterSpacing: 0.4, lineHeight: 14 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
