export function learningLayout(windowWidth: number) {
  const width = Math.max(240, Math.min(840, windowWidth));
  const padding = width < 380 ? 14 : width < 700 ? 20 : 28;
  return { width, padding, compact: width < 380, columns: width >= 700 ? 3 : 2,
    contentWidth: width - padding * 2, mascotSize: Math.min(132, width * 0.26),
    nodeSize: width < 380 ? 74 : 84, pathOffset: Math.min(70, (width - padding * 2) * 0.18) };
}
