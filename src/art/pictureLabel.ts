import { pictureFor } from './pictures';
/** Separate UI illustrations without splitting or reordering any Kurdish letters. */
export function pictureLabel(text:string):{text:string;symbols:string[]} {
  const symbols:string[]=[];
  const clean=text.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}](?:[\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]|\u200D[\p{Extended_Pictographic}\p{Regional_Indicator}])*/gu,token=>{
    if(!pictureFor(token))return token;
    symbols.push(token);return '';
  });
  return {text:clean,symbols};
}
