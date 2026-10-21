// Screen-only text (not narrated). Kept out of WritingScreen.tsx, whose strings are scanned for offline narration.
export const STAGE_TITLES = {
  trace: 'هەنگاوی ١: بە پەنجەت بەسەر پیتی خۆلەمێشییەکەدا بڕۆ',
  copy: 'هەنگاوی ٢: نموونەکە ببینە، پاشان خۆت بیکێشەوە',
  independent: 'هەنگاوی ٣: بێ نموونە، لە بیرت بیکێشە',
} as const;
export const OPEN_WORD_WRITING = 'وشە و ڕستە بنووسم 📝';
export const OVERALL_SCORE_LABEL = 'نمرەی گشتی';

// Labels for icon buttons and tabs (screen readers and text only; never narrated).
export const TOOL_LABELS = { play: 'پیشاندان', stop: 'وەستاندن', undo: 'هێڵی پێشوو', erase: 'سڕینەوە' } as const;
export const PEN_LABELS = ['قەڵەمی یەکەم', 'قەڵەمی دووەم', 'قەڵەمی سێیەم'] as const;
export const MODE_LABELS = ['١ ڕێنما', '٢ نموونە', '٣ سەربەخۆ'] as const;
export const INK_TOOL_LABELS = { thin: 'قەڵەمی باریک', thick: 'قەڵەمی ئەستوور', expand: 'تەختە گەورە بکە', collapse: 'تەختە بچووک بکەرەوە' } as const;
