import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { addScreenTime, bedtimeActive, dailyLimitSeconds, dayKey } from '../services/sessionPolicy';
import { soundService } from '../services/soundService';

export function useSessionGuard() {
  const store = useAppStore();
  const { setLearningPaused } = store;
  const [now, setNow] = useState(() => Date.now());
  const [takingBreak, setTakingBreak] = useState(false);
  const latest = useRef({ store, takingBreak });
  const log = useRef<Record<string, number>>({});
  const touched = useRef(0), speaking = useRef(false);
  useEffect(() => { latest.current = { store, takingBreak }; }, [store, takingBreak]);
  useEffect(() => soundService.subscribe(value => { speaking.current = value; }), []);
  useEffect(() => {
    if (!store.isHydrated || !store.profiles.length) return;
    log.current = { ...store.currentProfile.screenTimeLog };
    touched.current = Date.now();
    let previous = Date.now(), savedAt = 0, foreground = AppState.currentState === 'active';
    const ownerId = store.currentProfile.id;
    const flush = () => { latest.current.store.recordScreenTime(log.current, ownerId); savedAt = Date.now(); };
    const tick = () => {
      const time = Date.now(), elapsed = time - previous; previous = time;
      const { store: current, takingBreak: paused } = latest.current;
      const limit = dailyLimitSeconds(current.parentSettings);
      const day = dayKey(new Date(time));
      const childScreen = !['parent-dashboard', 'onboarding', 'paywall'].includes(current.route);
      const allowed = foreground && childScreen && !paused && !current.parentGateOpen && !current.exitConfirmOpen
        && !bedtimeActive(current.parentSettings, new Date(time)) && (log.current[day] || 0) < limit;
      if (allowed && elapsed > 0 && elapsed <= 5000 && (speaking.current || time - touched.current <= 120000)) {
        log.current = addScreenTime(log.current, time - elapsed, time, limit);
      }
      if (time - savedAt >= 5000 || !allowed) flush();
      setNow(time);
    };
    const change = AppState.addEventListener('change', state => {
      tick(); foreground = state === 'active'; previous = Date.now(); flush();
    });
    const blur = Platform.OS === 'android' ? AppState.addEventListener('blur', () => { tick(); foreground = false; flush(); }) : undefined;
    const focus = Platform.OS === 'android' ? AppState.addEventListener('focus', () => { foreground = AppState.currentState === 'active'; previous = Date.now(); }) : undefined;
    const timer = setInterval(tick, 1000);
    return () => { clearInterval(timer); change?.remove(); blur?.remove(); focus?.remove(); flush(); };
    // The clock belongs to a child; latest.current supplies changing screen/settings without resetting it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentProfile.id, store.isHydrated]);
  const today = dayKey(new Date(now));
  // State is published by tick; refs are read only inside that tick and event handlers.
  const [used, setUsed] = useState(0);
  useEffect(() => { setUsed(log.current[today] || 0); }, [now, today]);
  const limit = dailyLimitSeconds(store.parentSettings);
  const bedtime = bedtimeActive(store.parentSettings, new Date(now));
  const exhausted = used >= limit;
  const blocked = store.isHydrated && store.profiles.length > 0 && store.route !== 'parent-dashboard' && (bedtime || exhausted || takingBreak);
  useEffect(() => { soundService.setLearningPaused(blocked); }, [blocked]);
  useEffect(() => { setLearningPaused(blocked); }, [blocked, setLearningPaused]);
  return {
    touch: () => { touched.current = Date.now(); }, usedSeconds: Math.floor(used),
    bedtime, exhausted, takingBreak, blocked,
    warning: !blocked && store.route !== 'parent-dashboard' && limit - used <= 120 && limit - used > 0,
    takeBreak: () => setTakingBreak(true), continueLearning: () => { touched.current = Date.now(); setTakingBreak(false); },
  };
}
