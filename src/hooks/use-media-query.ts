
import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  const getServerSnapshot = () => false;

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const media = window.matchMedia(query);
    media.addEventListener('change', onStoreChange);
    return () => media.removeEventListener('change', onStoreChange);
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
