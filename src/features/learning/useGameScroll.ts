import { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';

/**
 * Keeps a game on one screen: a new question starts at the top, and once an answer is judged the view moves down to the
 * result and the "next" button, so a child never has to hunt for them.
 */
export function useGameScroll(question: unknown, answered: boolean) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => { ref.current?.scrollTo({ y: 0, animated: true }); }, [question]);
  useEffect(() => {
    if (!answered) return;
    const timer = setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 160);
    return () => clearTimeout(timer);
  }, [answered, question]);
  return ref;
}
