import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD_PX = 80;
const SWIPE_MAX_TIME_MS = 300;
const VERTICAL_MAX_DRIFT_PX = 40;

/**
 * Returns handlers for touch start/end to detect a downward swipe and call onClose.
 * Attach to the modal overlay or content (e.g. onTouchStart, onTouchEnd).
 */
export function useSwipeToClose(onClose: () => void) {
  const startRef = useRef<{ y: number; x: number; time: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      startRef.current = { y: t.clientY, x: t.clientX, time: Date.now() };
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startRef.current) return;
      const t = e.changedTouches[0];
      const deltaY = t.clientY - startRef.current.y;
      const deltaX = t.clientX - startRef.current.x;
      const elapsed = Date.now() - startRef.current.time;
      startRef.current = null;

      if (
        deltaY > SWIPE_THRESHOLD_PX &&
        elapsed < SWIPE_MAX_TIME_MS &&
        Math.abs(deltaX) < VERTICAL_MAX_DRIFT_PX
      ) {
        onClose();
      }
    },
    [onClose]
  );

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
