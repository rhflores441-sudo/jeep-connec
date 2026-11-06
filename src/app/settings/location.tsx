import {
  Check,
  Compass,
  Crosshair,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { searchPlaces, type Place } from '@/services/geocoding';
import { useLocation, type GpsStatus } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import { formatCoord, formatSpeed, formatUpdatedAt } from '@/utils/format';
import { AppText } from '@/components/ui/AppText';
import { Card, CardDivider } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';

export default function LocationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings } = useSettings();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const proximityLatitude = location.effectiveCoordinates?.latitude;
  const proximityLongitude = location.effectiveCoordinates?.longitude;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      searchPlaces(trimmed, {
        limit: 5,
        proximity:
          proximityLatitude !== undefined && proximityLongitude !== undefined
            ? { latitude: proximityLatitude, longitude: proximityLongitude }
            : undefined,
        signal: controller.signal,
      })
        .then((places) => {
          if (controller.signal.aborted) return;
          setResults(places);
          setSearchError(places.length === 0 ? 'No se encontraron lugares con ese nombre.' : null);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(
            error instanceof Error && error.message
              ? error.message
              : 'No se pudo consultar Nominatim. Revisa tu conexión.',
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 650);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, proximityLatitude, proximityLongitude]);

  const selectPlace = (place: Place) => {
    updateSettings({
      useManualLocation: true,
      manualLocation: {
        label: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    });
    setQuery('');
    setResults([]);
    setSearchError(null);
  };

  const toggleManual = (value: boolean) => {
    if (value && !settings.manualLocation) {
      Alert.alert(
        'Sin ubicación manual',
        'Busca una dirección o ciudad y selecciónala primero. Después podrás activar la ubicación manual.',
      );
      return;
    }
    updateSettings({ useManualLocation: value });
  };

  const removeManual = () => {
    Alert.alert('Quitar ubicación manual', 'La app volverá a usar el GPS del dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => updateSettings({ useManualLocation: false, manualLocation: null }),
      },
    ]);
  };

  const manual = settings.manualLocation;
  const gps = gpsMeta(location.gpsStatus);
  const permissionLabel =
    location.permission === 'granted'
      ? 'Concedido'
      : location.permission === 'denied'
        ? 'Denegado'
        : 'Sin autorizar';

  return (
    <Screen>
      <Header
        title="Ubicación"
        subtitle={location.isManualLocation ? 'Ubicación manual activa' : 'GPS del dispositivo'}
        right={
          <PressableScale
            onPress={() => void (location.permission === 'granted' ? location.refresh() : location.requestPermission())}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="Actualizar ubicación"
            style={[styles.headerButton, { backgroundColor: colors.accentSoft }]}
          >
            <RefreshCw size={18} color={colors.accent} />
          </PressableScale>
        }
      />

      <Card>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: location.permission === 'granted' ? colors.greenSoft : colors.amberSoft }]}>
            {location.permission === 'granted' ? (
              <Crosshair size={22} color={colors.green} />
            ) : (
              <TriangleAlert size={22} color={colors.amber} />
            )}
          </View>
          <View style={styles.statusText}>
            <AppText variant="micro" color="muted" style={styles.kicker}>
              {location.isManualLocation ? 'UBICACIÓN MANUAL' : 'UBICACIÓN DEL DISPOSITIVO'}
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {location.locationLabel ?? 'Sin ubicación'}
            </AppText>
            <AppText variant="caption" color={location.permission === 'granted' ? 'green' : 'amber'}>
              Permiso: {permissionLabel} · Señal GPS: {gps.label}
            </AppText>
          </View>
        </View>

        <View style={[styles.stats, { borderTopColor: colors.border }]}>
          <Stat
            icon={Gauge}
            label="Precisión"
            value={location.accuracy === null ? '—' : `${Math.round(location.accuracy)} m`}
          />
          <Stat
            icon={Navigation}
            label="Velocidad"
            value={`${formatSpeed(location.speedMps, settings.units)} ${
              settings.units === 'metric' ? 'km/h' : 'mph'
            }`}
          />
          <Stat
            icon={Compass}
            label="Rumbo"
            value={location.heading === null ? '—' : `${Math.round(location.heading)}°`}
          />
          <Stat
            icon={LocateFixed}
            label="Actualizado"
            value={formatUpdatedAt(location.updatedAt)}
          />
        </View>

        {location.effectiveCoordinates ? (
          <View style={[styles.coords, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceHigh }]}>
            <AppText variant="micro" color="muted" style={styles.coordsLabel}>
              COORDENADAS EFECTIVAS
            </AppText>
            <AppText variant="mono" selectable>
              {formatCoord(location.effectiveCoordinates.latitude, location.effectiveCoordinates.longitude)}
            </AppText>
          </View>
        ) : null}

        {location.error ? (
          <View style={[styles.error, { backgroundColor: colors.amberSoft }]}>
            <TriangleAlert size={16} color={colors.amber} />
            <AppText variant="caption" color="amber" style={styles.errorText}>
              {location.error}
            </AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          {location.permission !== 'granted' ? (
            <PressableScale
              onPress={() => void location.requestPermission()}
              scaleTo={0.97}
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            >
              <Crosshair size={16} color={colors.white} />
              <AppText variant="bodyStrong" color="white">
                Permitir ubicación
              </AppText>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => void location.refresh()}
              scaleTo={0.97}
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            >
              <RefreshCw size={16} color={colors.white} />
              <AppText variant="bodyStrong" color="white">
                Actualizar GPS
              </AppText>
            </PressableScale>
          )}
          <PressableScale
            onPress={location.openSystemSettings}
            scaleTo={0.97}
            accessibilityRole="button"
            style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
          >
            <Settings2 size={16} color={colors.text} />
            <AppText variant="bodyStrong">Ajustes del sistema</AppText>
          </PressableScale>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Ubicación manual"
          subtitle="Sustituye el GPS para clima, mapas y velocidad"
          icon={MapPin}
        />
        <Card>
          <SwitchRow
            title="Usar ubicación manual"
            subtitle={
              manual
                ? `Activa: ${manual.label}`
                : 'Busca una ciudad o dirección para activar esta opción.'
            }
            icon={MapPin}
            value={settings.useManualLocation}
            onValueChange={toggleManual}
            last
          />

          <View style={styles.searchBlock}>
            <TextField
              icon={Search}
              placeholder="Ciudad, colonia o dirección"
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              autoCapitalize="words"
              returnKeyType="search"
              right={searching ? <ActivityIndicator size="small" color={colors.accent} /> : undefined}
            />
            <AppText variant="caption" color="muted">
              Búsqueda con Nominatim (OpenStreetMap). La política del servicio limita las solicitudes
              a una por segundo.
            </AppText>

            {results.length > 0 ? (
              <View style={[styles.results, { borderColor: colors.border }]}>
                {results.map((place, index) => (
                  <PressableScale
                    key={place.id}
                    onPress={() => selectPlace(place)}
                    scaleTo={0.99}
                    accessibilityRole="button"
                    style={[
                      styles.result,
                      index === results.length - 1
                        ? null
                        : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={[styles.resultIcon, { backgroundColor: colors.accentSoft }]}>
                      <MapPin size={16} color={colors.accent} />
                    </View>
                    <View style={styles.resultText}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {place.name}
                      </AppText>
                      <AppText variant="caption" color="muted" numberOfLines={2}>
                        {place.displayName}
                      </AppText>
                    </View>
                    <Check size={17} color={colors.textMuted} />
                  </PressableScale>
                ))}
              </View>
            ) : null}

            {searchError ? (
              <View style={[styles.searchError, { backgroundColor: colors.amberSoft }]}>
                <TriangleAlert size={15} color={colors.amber} />
                <AppText variant="caption" color="amber" style={styles.errorText}>
                  {searchError}
                </AppText>
              </View>
            ) : null}
          </View>

          <CardDivider />

          {manual ? (
            <View style={styles.manualRow}>
              <View style={[styles.manualIcon, { backgroundColor: colors.greenSoft }]}>
                <MapPin size={19} color={colors.green} />
              </View>
              <View style={styles.manualText}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {manual.label}
                </AppText>
                <AppText variant="caption" color="muted">
                  {formatCoord(manual.latitude, manual.longitude)}
                </AppText>
              </View>
              <PressableScale
                onPress={removeManual}
                scaleTo={0.9}
                accessibilityRole="button"
                accessibilityLabel="Quitar ubicación manual"
                style={[styles.removeButton, { backgroundColor: colors.dangerSoft }]}
              >
                <Trash2 size={16} color={colors.danger} />
              </PressableScale>
            </View>
          ) : (
            <View style={styles.manualEmpty}>
              <Search size={18} color={colors.textMuted} />
              <AppText variant="caption" color="muted">
                No hay una ubicación manual guardada. La app usa el GPS cuando tiene permiso.
              </AppText>
            </View>
          )}
        </Card>
      </View>

      <View style={[styles.note, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <LocateFixed size={17} color={colors.accent} />
        <AppText variant="caption" color="secondary" style={styles.noteText}>
          La ubicación se usa para clima, mapas, velocidad GPS y rutas. No se envía a servidores de
          Jeep Connect: las consultas van directamente a Open-Meteo, OpenStreetMap y OSRM.
        </AppText>
      </View>
    </Screen>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Icon size={15} color={colors.textMuted} />
      <View style={styles.statText}>
        <AppText variant="micro" color="muted" style={styles.statLabel}>
          {label.toUpperCase()}
        </AppText>
        <AppText variant="caption" font="semibold" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function gpsMeta(status: GpsStatus): { label: string } {
  switch (status) {
    case 'excellent':
      return { label: 'Excelente' };
    case 'good':
      return { label: 'Buena' };
    case 'weak':
      return { label: 'Débil' };
    case 'searching':
      return { label: 'Buscando' };
    case 'requesting':
      return { label: 'Solicitando permiso' };
    case 'denied':
      return { label: 'Permiso denegado' };
    case 'disabled':
      return { label: 'Servicios apagados' };
    case 'error':
      return { label: 'Error' };
    default:
      return { label: 'Sin señal' };
  }
}

const styles = StyleSheet.create({
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 1 },
  kicker: { fontSize: 8.5, letterSpacing: 1 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  stat: { flexBasis: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  statText: { flex: 1, gap: 1 },
  statLabel: { fontSize: 8, letterSpacing: 0.7 },
  coords: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, gap: 3 },
  coordsLabel: { fontSize: 8, letterSpacing: 0.8 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  primaryButton: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  searchBlock: { marginTop: spacing.md, gap: spacing.sm },
  results: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', marginTop: spacing.xs },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  resultIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  resultText: { flex: 1, gap: 1 },
  searchError: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: radius.md, padding: spacing.sm },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  manualIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  manualText: { flex: 1, gap: 1 },
  manualEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.xxl,
  },
  noteText: { flex: 1 },
});
