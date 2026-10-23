/** Screen-only text for the adventures. Children who cannot read are guided by voice and pictures; this text is for parents and early readers. */
export const QUEST_TILE = { title: 'ماجەراکان', hint: 'یارمەتی پەپوولە بدە' };
export const QUEST_TEXT = {
  pick: 'ماجەرایەک هەڵبژێرە',
  listen: 'دووبارە ببیستە',
  step: (a: number, b: number) => `${a} / ${b}`,
  done: 'ماجەراکە تەواو بوو!',
  reward: (n: number) => `+${n} 🍯`,
  rewardDone: 'پاداشی ئەمڕۆت وەرگرتبوو',
  again: 'دووبارە',
  back: 'گەڕانەوە',
  doneToday: '✓',
};
