import { Compass, House, MoveLeft, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { APP } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const pathname = usePathname();

  const canGoBack = router.canGoBack();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <View style={styles.content}>
            <View style={[styles.iconStage, { backgroundColor: colors.amberSoft }]}>
              <Compass size={42} color={colors.amber} strokeWidth={1.8} />
              <View style={[styles.alertBadge, { backgroundColor: colors.amber }]}>
                <TriangleAlert size={12} color={colors.black} strokeWidth={2.4} />
              </View>
            </View>

            <AppText variant="micro" color="muted">
              RUTA NO ENCONTRADA
            </AppText>
            <AppText variant="title" align="center">
              Te saliste del mapa
            </AppText>
            <AppText variant="body" color="secondary" align="center">
              La pantalla que buscas no existe o cambió de lugar. Puedes volver al tablero de {APP.name} o regresar a la
              pantalla anterior.
            </AppText>

            <View style={[styles.pathBox, { backgroundColor: colors.surfaceHigh, borderColor: colors.border }]}>
              <AppText variant="mono" color="muted" numberOfLines={1}>
                {pathname || '/'}
              </AppText>
            </View>

            <View style={styles.actions}>
              <PressableScale
                onPress={() => router.replace('/')}
                scaleTo={0.97}
                accessibilityRole="button"
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              >
                <House size={17} color={colors.white} />
                <AppText variant="bodyStrong" color="white">
                  Ir al inicio
                </AppText>
              </PressableScale>
              {canGoBack ? (
                <PressableScale
                  onPress={() => router.back()}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                >
                  <MoveLeft size={17} color={colors.text} />
                  <AppText variant="bodyStrong">Volver</AppText>
                </PressableScale>
              ) : null}
            </View>

            <View style={styles.footer}>
              <TriangleAlert size={13} color={colors.textMuted} />
              <AppText variant="caption" color="muted" align="center">
                Si llegaste aquí desde un enlace, revisa que la dirección esté completa.
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxxl },
  content: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  iconStage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  alertBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathBox: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: '100%',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  primaryButton: {
    flexGrow: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
  },
  secondaryButton: {
    flexGrow: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xl },
});
