import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2 } from 'lucide-react-native';
import { BackButton } from '../../components/BackButton';
import { HelpHint } from '../../components/HelpButton';
import { PapulaMascot } from '../../components/PapulaMascot';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { useAppearance } from '../../theme/useAppearance';
import { GOLD } from '../../theme/tokens';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';
import { QUESTS, Quest, QuestStep, questDoneToday, questSteps } from '../../data/quests';
import { FIND_PHRASE, QUEST_VOICE, SPOKEN_GUIDES } from '../../data/spokenGuides';
import { QUEST_TEXT as T } from './questText';

const NEXT_MS = 1700;

/** Story missions for children who cannot read: Papula's request is spoken, the child taps the right picture. */
export const QuestGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { colors: c, isNight } = useAppearance();
  const { currentProfile, recordPracticeResult, finishQuest } = useAppStore();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [steps, setSteps] = useState<QuestStep[]>([]);
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [rightId, setRightId] = useState<string | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const missed = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = steps[index], finished = !!quest && steps.length > 0 && index >= steps.length;
  const voice = quest ? QUEST_VOICE[quest.id] : undefined;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); void soundService.stopSpeaking(); }, []);

  // Each step is spoken as it appears: «<the word> find it». The first step also tells Papula's story.
  const ask = (item: QuestStep['item'], withIntro: boolean) => {
    const find = [item.word, FIND_PHRASE];
    void (async () => {
      if (withIntro && voice && await soundService.speakPhrases([voice.intro, ...find])) return;
      if (await soundService.speakPhrases(find)) return;
      if (soundService.canSpeak(item.word)) await soundService.speakWord(item.word);
    })();
  };
  useEffect(() => { if (quest && step && !rightId) ask(step.item, index === 0); }, [quest, index, steps]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (finished && voice && soundService.canSpeak(voice.outro)) void soundService.speakWord(voice.outro); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (next: Quest) => { setQuest(next); setSteps(questSteps(next, currentProfile)); setIndex(0); setWrongIds([]); setRightId(null); setReward(null); missed.current = false; };
  const pick = (id: string) => {
    if (!step || rightId || wrongIds.includes(id)) return;
    const ok = id === step.item.id;
    if (!missed.current) recordPracticeResult([], ok, step.item.id, 'word', false);
    if (!ok) { missed.current = true; setWrongIds(list => [...list, id]); soundService.playEncouragingTryAgain(); return; }
    setRightId(id); soundService.playCorrect(false);
    if (soundService.canSpeak(step.item.word)) void soundService.speakWord(step.item.word);
    timer.current = setTimeout(() => {
      if (index + 1 >= steps.length) setReward(finishQuest(quest!.id));
      setIndex(index + 1); setWrongIds([]); setRightId(null); missed.current = false;
    }, NEXT_MS);
  };
  const sky = quest ? (isNight ? quest.skyNight : quest.sky) : (isNight ? ['#2c2a72', '#1d1a4f'] as [string, string] : ['#e6dcff', '#d3ebff'] as [string, string]);
  const ink = isNight ? '#ffffff' : '#3b2f63';

  if (!quest) {
    const guide = SPOKEN_GUIDES.quests;
    return <ScrollView contentContainerStyle={s.page}>
      <HelpHint text={guide} disabled={!soundService.canSpeak(guide)} />
      <Text style={[s.title, { color: c.ink }]}>{T.pick}</Text>
      {QUESTS.map(item => <TactileButton key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => start(item)} style={s.cardWrap}>
        <LinearGradient colors={isNight ? item.skyNight : item.sky} style={s.card}>
          <Text style={s.cardEmoji}>{item.emoji}</Text>
          <Text style={[s.cardTitle, { color: isNight ? '#fff' : '#3b2f63' }]}>{item.title}</Text>
          {questDoneToday(currentProfile, item.id) && <Text style={s.tick}>{T.doneToday}</Text>}
        </LinearGradient>
      </TactileButton>)}
      <BackButton fullWidth onPress={onExit}>{T.back}</BackButton>
    </ScrollView>;
  }

  if (finished) return <ScrollView contentContainerStyle={s.page}>
    <LinearGradient colors={sky} style={s.stage}>
      <PapulaMascot size={200} mood="surprised" />
      <Text style={[s.title, { color: ink }]}>{T.done}</Text>
      <View style={s.basket}>{steps.map(item => <Text key={item.item.id} style={s.basketEmoji}>{item.item.emoji}</Text>)}</View>
      <Text style={[s.reward, { color: GOLD.starInk }]}>{reward ? T.reward(reward) : T.rewardDone}</Text>
    </LinearGradient>
    <TactileButton accessibilityRole="button" accessibilityLabel={T.again} style={s.gold} onPress={() => start(quest)}><Text style={s.goldText}>{T.again}</Text></TactileButton>
    <BackButton fullWidth onPress={() => setQuest(null)}>{T.back}</BackButton>
  </ScrollView>;

  if (!step) return <View style={s.page}><BackButton fullWidth onPress={() => setQuest(null)}>{T.back}</BackButton></View>;
  const guide = SPOKEN_GUIDES.questStep;
  return <ScrollView contentContainerStyle={s.page}>
    <HelpHint text={guide} disabled={!soundService.canSpeak(guide)} />
    <LinearGradient colors={sky} style={s.stage}>
      <View style={s.basket} accessibilityRole="progressbar" accessibilityLabel={quest.title} accessibilityValue={{ min: 0, max: steps.length, now: index }}>
        {steps.map((item, i) => <Text key={item.item.id} style={[s.basketEmoji, i >= index && s.basketEmpty]}>{i < index ? item.item.emoji : '⚪'}</Text>)}
      </View>
      <PapulaMascot size={150} mood={rightId ? 'happy' : wrongIds.length ? 'calm' : index === 0 ? 'surprised' : 'calm'} />
      <TactileButton accessibilityRole="button" accessibilityLabel={`${T.listen}: ${step.item.word}`} onPress={() => ask(step.item, false)} style={[s.bubble, { backgroundColor: c.paper, borderColor: c.edge }]}>
        <Volume2 size={30} color={GOLD.starInk} strokeWidth={2.6} />
        <Text style={[s.word, { color: c.ink }]}>{step.item.word}</Text>
      </TactileButton>
    </LinearGradient>
    <View style={s.options}>{step.options.map(option => {
      const wrong = wrongIds.includes(option.id), right = rightId === option.id;
      return <TactileButton key={option.id} accessibilityRole="button" accessibilityLabel={option.word} disabled={!!rightId || wrong} onPress={() => pick(option.id)}
        style={[s.option, { backgroundColor: c.paper, borderColor: right ? '#21b977' : c.edge }, right && s.optionRight, wrong && s.optionWrong]}>
        <Text style={s.optionEmoji}>{option.emoji}</Text>
      </TactileButton>;
    })}</View>
    <BackButton fullWidth onPress={() => { void soundService.stopSpeaking(); setQuest(null); }}>{T.back}</BackButton>
  </ScrollView>;
};

const s = StyleSheet.create({
  page: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 16, gap: 14, paddingBottom: 24 },
  title: { fontSize: 22, textAlign: 'center', fontFamily: 'IBMPlexSansArabic_700Bold' },
  cardWrap: { alignSelf: 'stretch' },
  card: { borderRadius: 26, minHeight: 92, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardEmoji: { fontSize: 46 }, cardTitle: { flex: 1, fontSize: 20, fontFamily: 'IBMPlexSansArabic_700Bold' }, tick: { fontSize: 24, color: '#1a7552', fontFamily: 'IBMPlexSansArabic_700Bold' },
  stage: { borderRadius: 30, padding: 16, alignItems: 'center', gap: 10 },
  basket: { flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  basketEmoji: { fontSize: 28 }, basketEmpty: { opacity: 0.45 },
  bubble: { minHeight: 64, paddingHorizontal: 22, borderRadius: 24, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  word: { fontSize: 28, fontFamily: 'IBMPlexSansArabic_700Bold' },
  options: { flexDirection: 'row', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  option: { width: 104, height: 104, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 58 },
  optionRight: { backgroundColor: '#dcfce7' }, optionWrong: { opacity: 0.35 },
  reward: { fontSize: 26, fontFamily: 'IBMPlexSansArabic_700Bold' },
  gold: { minHeight: 58, borderRadius: 20, backgroundColor: GOLD.face, borderBottomWidth: 5, borderBottomColor: GOLD.lip, alignItems: 'center', justifyContent: 'center' },
  goldText: { color: GOLD.ink, fontSize: 19, fontFamily: 'IBMPlexSansArabic_700Bold' },
});
