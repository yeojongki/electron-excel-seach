import Dexie, { Table } from 'dexie';
import { QueryOptions, SearchIndex, Token } from 'types/search-index';

const projectName = '9708_excel_locale';
export const version = 1;
export const incrementIdKey = `${projectName}_id`;
export const dataDBName = `${projectName}_data`;
export const indexDBName = `${projectName}_index`;

export interface Locale {
  id?: number;
  idx?: string[];
  /**
   * 中文
   */
  cn: string;
  /**
   * 英文
   */
  en: string;
  /**
   * 印尼
   */
  in?: string;
  /**
   * 泰文
   */
  th?: string;
  /**
   * 越南
   */
  vn?: string;
  /**
   * 工作簿/项目名
   */
  sheet: string;
  /**
   * 工作表
   */
  table: string;
}

let _searchIndex: SearchIndex;

window
  .SearchIndex({
    name: indexDBName,
    storeVectors: true,
  })
  .then((result: SearchIndex) => {
    _searchIndex = result;
  });

export const ignoreChars =
  ' \t\r\n~!@#$%^&*()_+-=【】、{}|;\':"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄';

export function getCurrentId() {
  return Number(localStorage.getItem(incrementIdKey));
}

export function setCurrentId(id: number | string) {
  localStorage.setItem(incrementIdKey, id + '');
}

export const indexDB = {
  async put<T = any>(items: T[]) {
    await _searchIndex.PUT(items);
  },
  async query(query: Token, options?: QueryOptions) {
    console.time('【index-query】');
    const result = await _searchIndex.QUERY(query, options);
    console.timeEnd('【index-query】');
    return result;
  },
};

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
