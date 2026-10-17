/** Pastel "macaron" tiles shared by every screen: soft face, a darker lip, dark ink and a saturated icon colour. */
export interface Tile { face: string; lip: string; ink: string; icon: string; chip: string }
const DAY: Tile[] = [
  { face: '#d3ebff', lip: '#a9d3f2', ink: '#3b2f63', icon: '#1f6fd1', chip: '#ffffff' },
  { face: '#e6dcff', lip: '#c9b8f5', ink: '#3b2f63', icon: '#6d4ae8', chip: '#ffffff' },
  { face: '#ede5ff', lip: '#cab8f5', ink: '#3b2f63', icon: '#7c3aed', chip: '#ffffff' },
  { face: '#cff3e6', lip: '#a3dcc6', ink: '#3b2f63', icon: '#1f8a64', chip: '#ffffff' },
  { face: '#ffefb8', lip: '#ecd27c', ink: '#3b2f63', icon: '#9a6a00', chip: '#ffffff' },
];
const NIGHT: Tile[] = [
  { face: '#233e66', lip: '#172b4a', ink: '#f6f1ff', icon: '#9bd0ff', chip: 'rgba(255,255,255,0.12)' },
  { face: '#3a2e70', lip: '#271f52', ink: '#f6f1ff', icon: '#c9b8ff', chip: 'rgba(255,255,255,0.12)' },
  { face: '#34296b', lip: '#241b4d', ink: '#f6f1ff', icon: '#d8b4fe', chip: 'rgba(255,255,255,0.12)' },
  { face: '#1f4a4a', lip: '#143434', ink: '#f6f1ff', icon: '#8ff0cf', chip: 'rgba(255,255,255,0.12)' },
  { face: '#4f4426', lip: '#37301a', ink: '#f6f1ff', icon: '#ffd65a', chip: 'rgba(255,255,255,0.12)' },
];
export const tileSet = (isNight: boolean): Tile[] => (isNight ? NIGHT : DAY);
