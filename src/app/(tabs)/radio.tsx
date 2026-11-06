import { Heart, Pause, Play, RadioTower, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { useLibrary } from '@/store/library';
import { useRadio } from '@/store/radio';
import {
  fetchMexicanStations,
  fetchStationsByGenre,
  fetchTopStations,
  RADIO_GENRES,
  searchStations,
  type RadioStation,
} from '@/services/radio';
import { errorMessage } from '@/utils/http';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { PlayerCard } from '@/components/player/PlayerCard';

type Source = { kind: 'mexico' } | { kind: 'top' } | { kind: 'genre'; genre: string };

const SOURCE_LABEL: Record<Source['kind'], string> = {
  mexico: 'México',
  top: 'Tendencias',
  genre: 'Género',
};

export default function RadioScreen() {
  const { colors } = useTheme();
  const { library, isRadioFavorite, toggleRadioFavorite } = useLibrary();
  const radio = useRadio();

  const [tab, setTab] = useState<'discover' | 'favorites'>('discover');
  const [source, setSource] = useState<Source>({ kind: 'mexico' });
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RadioStation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'discover') return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const request =
      source.kind === 'mexico'
        ? fetchMexicanStations(40, controller.signal)
        : source.kind === 'top'
          ? fetchTopStations(40, controller.signal)
          : fetchStationsByGenre(source.genre, 40, controller.signal);
    request
      .then((found) => {
        if (controller.signal.aborted) return;
        setStations(found);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setStations([]);
        setError(errorMessage(reason, 'No fue posible cargar las estaciones.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [source, tab, reloadToken]);

  useEffect(() => {
    const trimmed = query.trim();
    if (tab !== 'discover' || trimmed.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchStations(trimmed, 40, controller.signal)
        .then((found) => {
          if (controller.signal.aborted) return;
          setSearchResults(found);
          setSearchError(null);
        })
        .catch((reason) => {
          if (controller.signal.aborted) return;
          setSearchResults([]);
          setSearchError(errorMessage(reason, 'No fue posible buscar estaciones.'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tab]);

  const favorites = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return library.radioFavorites;
    return library.radioFavorites.filter(
      (station) =>
        station.name.toLowerCase().includes(trimmed) ||
        station.tags.some((tag) => tag.toLowerCase().includes(trimmed)),
    );
  }, [library.radioFavorites, query]);

  const displayed = tab === 'favorites' ? favorites : query.trim().length >= 2 ? searchResults : stations;
  const listLoading = tab === 'discover' && (loading || searching);
  const listError = tab === 'discover' ? (query.trim().length >= 2 ? searchError : error) : null;

  const handlePlay = useCallback(
    (station: RadioStation) => {
      radio.playStation(station, displayed.length > 0 ? displayed : [station]);
    },
    [displayed, radio],
  );

  const subtitle = (station: RadioStation) => {
    const place = [station.state, station.country].filter(Boolean).join(', ');
    const tags = station.tags.slice(0, 3).join(' · ');
    return [place, tags].filter(Boolean).join(' — ') || 'Radio en vivo';
  };

  return (
    <Screen tabInset>
      <Header
        title="Radio"
        subtitle="Radio Browser · Transmisiones reales"
        showBack={false}
        right={
          <IconButton
            icon={RefreshCw}
            label="Actualizar estaciones"
            onPress={() => setReloadToken((value) => value + 1)}
            disabled={tab === 'favorites'}
          />
        }
      />

      <SegmentedControl
        options={[
          { value: 'discover', label: 'Descubrir' },
          { value: 'favorites', label: `Favoritas${library.radioFavorites.length > 0 ? ` (${library.radioFavorites.length})` : ''}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      <View style={styles.search}>
        <TextField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder={tab === 'favorites' ? 'Filtrar favoritas' : 'Buscar por nombre de estación'}
        />
      </View>

      {radio.station ? (
        <View style={styles.player}>
          <PlayerCard compact />
        </View>
      ) : null}

      {radio.error ? (
        <PressableScale
          onPress={radio.dismissError}
          scaleTo={0.99}
          style={[styles.radioError, { backgroundColor: colors.dangerSoft }]}
        >
          <AppText variant="caption" color="danger" numberOfLines={2}>
            {radio.error}
          </AppText>
          <AppText variant="micro" color="muted">
            TOCA PARA CERRAR
          </AppText>
        </PressableScale>
      ) : null}

      {tab === 'discover' && query.trim().length < 2 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip
            label="México"
            selected={source.kind === 'mexico'}
            onPress={() => setSource({ kind: 'mexico' })}
          />
          <Chip
            label="Tendencias"
            selected={source.kind === 'top'}
            onPress={() => setSource({ kind: 'top' })}
          />
          {RADIO_GENRES.map((genre) => (
            <Chip
              key={genre.id}
              label={genre.label}
              selected={source.kind === 'genre' && source.genre === genre.id}
              onPress={() => setSource({ kind: 'genre', genre: genre.id })}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.listHeader}>
        <AppText variant="micro" color="muted" style={styles.listKicker}>
          {tab === 'favorites'
            ? 'FAVORITAS'
            : query.trim().length >= 2
              ? 'RESULTADOS'
              : `${SOURCE_LABEL[source.kind].toUpperCase()}${source.kind === 'genre' ? ` · ${source.genre.toUpperCase()}` : ''}`}
        </AppText>
        {!listLoading && displayed.length > 0 ? (
          <AppText variant="caption" color="muted">
            {displayed.length} estaciones
          </AppText>
        ) : null}
      </View>

      {tab === 'favorites' && displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon={Heart}
            title="Sin favoritas todavía"
            message="Toca el corazón de una estación para guardarla y tenerla siempre a la mano."
          />
        </Card>
      ) : listLoading && displayed.length === 0 ? (
        <Card>
          <LoadingState label="Cargando estaciones de radio…" />
        </Card>
      ) : listError && displayed.length === 0 ? (
        <Card>
          <ErrorState
            message={listError}
            onRetry={() => {
              if (query.trim().length >= 2) setQuery('');
              else setReloadToken((value) => value + 1);
            }}
          />
        </Card>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon={RadioTower}
            title="Sin resultados"
            message="Prueba con otro nombre, género u otro país en el directorio de Radio Browser."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <View style={styles.list}>
            {displayed.map((station, index) => {
              const favorite = isRadioFavorite(station.id);
              const active = radio.station?.id === station.id;
              return (
                <ListRow
                  key={station.id}
                  title={station.name}
                  subtitle={subtitle(station)}
                  icon={RadioTower}
                  iconColor={active ? colors.green : colors.textSecondary}
                  showChevron={false}
                  last={index === displayed.length - 1}
                  onPress={() => handlePlay(station)}
                  right={
                    <View style={styles.rowActions}>
                      <PressableScale
                        onPress={() => toggleRadioFavorite(station)}
                        scaleTo={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={favorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                        style={styles.heart}
                      >
                        <Heart
                          size={18}
                          color={favorite ? colors.danger : colors.textMuted}
                          fill={favorite ? colors.danger : 'transparent'}
                          strokeWidth={2}
                        />
                      </PressableScale>
                      <View
                        style={[
                          styles.playBubble,
                          {
                            backgroundColor: active ? colors.greenSoft : colors.accentSoft,
                          },
                        ]}
                      >
                        {active && radio.isPlaying ? (
                          <Pause size={16} color={colors.green} fill={colors.green} />
                        ) : (
                          <Play size={16} color={colors.accent} fill={colors.accent} />
                        )}
                      </View>
                    </View>
                  }
                />
              );
            })}
          </View>
        </Card>
      )}

      <View style={styles.footer}>
        <AppText variant="micro" color="muted" align="center">
          Datos de Radio Browser · La disponibilidad depende de cada emisora.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginTop: spacing.md },
  player: { marginTop: spacing.lg },
  radioError: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    gap: 4,
  },
  chips: { gap: spacing.sm, paddingVertical: spacing.md },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  listKicker: { letterSpacing: 1.3 },
  list: { paddingHorizontal: spacing.lg },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heart: { padding: 4 },
  playBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
});
