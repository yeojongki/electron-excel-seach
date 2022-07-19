import Dexie, { Table } from 'dexie';
import SI from 'search-index';

export type SearchIndex = Awaited<ReturnType<typeof SI>>;

const projectName = '9708_excel_locale';
export const version = 1;
export const incrementIdKey = `${projectName}_id`;
export const dataDBName = `${projectName}_data`;
export const indexDBName = `${projectName}_index`;

export interface Locale {
  // id: string;
  idx?: string[];
  cn: string;
  en: string;
  in: string;
  sheet: string;
  table: string;
}

let searchDB: SearchIndex;

window
  .SearchIndex({
    name: indexDBName,
    storeVectors: true,
  })
  .then((result: SearchIndex) => {
    searchDB = result;
  });

// const ignoreChars =
//   " \t\r\n~!@#$%^&*()_+-=【】、{}|;':\"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄";

export function getCurrentId() {
  return Number(localStorage.getItem(incrementIdKey));
}

export function setCurrentId(id: number | string) {
  localStorage.setItem(incrementIdKey, id + '');
}

export async function put<T = any>(items: T[]) {
  await searchDB.PUT(items);
}

export async function query(searchParams: any) {
  console.time('query');

  const result = await searchDB.QUERY(
    {
      OR: searchParams,
    },
    { DOCUMENTS: true },
  );

  console.timeEnd('query');
  return result;
}

export class DataDB extends Dexie {
  // 'locale' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  locale!: Table<Locale>;

  constructor() {
    super(dataDBName);
    this.version(version).stores({
      locale: '&id, cn, en, in', // Primary key and indexed props
    });
  }
}

export const dataDB = new DataDB();
