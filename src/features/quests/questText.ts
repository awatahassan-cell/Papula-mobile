/** Screen-only text for the adventures. Children who cannot read are guided by voice and pictures; this text is for parents and early readers. */
export const QUEST_TILE = { title: 'یارمەتی پەپوولە', hint: 'با یاری بکەین' };
export const QUEST_TEXT = {
  pick: 'یارییەک هەڵبژێرە',
  listen: 'دووبارە ببیستە',
  step: (a: number, b: number) => `${a} / ${b}`,
  done: 'تەواو بوو!',
  reward: (n: number) => `+${n} 🍯`,
  rewardDone: 'پاداشی ئەمڕۆت وەرگرتبوو',
  again: 'دووبارە',
  back: 'گەڕانەوە',
  doneToday: '✓',
};
