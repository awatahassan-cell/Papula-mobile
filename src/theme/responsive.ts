import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number; height: number;
  /** Phone-sized below 720; tablets in portrait start at 720. */
  tablet: boolean;
  /** Landscape tablets and large screens: room for two columns. */
  wide: boolean;
  landscape: boolean;
  /** Widest the page content should grow. */
  pageMax: number;
}
export function responsive(width: number, height: number): ResponsiveInfo {
  const tablet = width >= 720, wide = width >= 900;
  return { width, height, tablet, wide, landscape: width > height, pageMax: wide ? 1120 : tablet ? 840 : 840 };
}
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  return responsive(width, height);
}
/** Side of the square writing board: fits the screen height when the board sits beside the controls. */
export function writingBoardSide(info: ResponsiveInfo, chrome = 380): number {
  if (info.wide && info.landscape) return Math.max(280, Math.min(560, info.height - chrome));
  return Math.max(160, Math.min(info.width - 40, info.tablet ? 560 : 460));
}
