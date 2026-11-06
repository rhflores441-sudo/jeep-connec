import { useEffect, useState } from 'react';

/** Reloj reactivo, con segundos opcionales para el modo automotriz. */
export function useClock(withSeconds = false): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(
      () => setNow(new Date()),
      withSeconds ? 1000 : 15_000,
    );
    return () => clearInterval(interval);
  }, [withSeconds]);

  return now;
}
