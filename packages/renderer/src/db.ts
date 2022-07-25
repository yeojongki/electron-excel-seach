// import Dexie, { Table } from "dexie";
import {
  QueryOptions,
  SearchIndex,
  SearchIndexOptions,
  Token,
  TokenizerArgs,
} from 'types/search-index';
import { nodejieba } from '#preload';

const projectName = '9708_excel_locale';
export const version = 1;
export const incrementIdKey = `${projectName}_id`;
export const dataDBName = `${projectName}_data`;
export const indexDBName = `${projectName}_index`;

export interface Locale {
  /**
   * seachIndex id
   */
  docId?: string;
  /**
   * 星标 1 加了星标 0 未加
   */
  like: string;
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
  book: string;
  /**
   * 工作表
   */
  table: string;
}

let _searchIndex: SearchIndex;

/**
 * 自定义分词 TODO 泰文 越南
 * @param param0
 * @returns
 */
const CUSTOM_SPLIT = ([tokens, field, ops]: TokenizerArgs) => {
  return Promise.resolve([
    field === 'cn'
      ? nodejieba.cutAll(tokens).filter((text) => !ignoreChars.includes(text))
      : field === 'en' || field === 'in'
      ? nodejieba.cutHMM(tokens).filter((text) => !ignoreChars.includes(text))
      : [tokens],
    field,
    ops,
  ]);
};

window
  .SearchIndex({
    name: indexDBName,
    storeVectors: true,
  } as SearchIndexOptions)
  .then((result: SearchIndex) => {
    _searchIndex = result;
    // console.log(result.EXPORT().then((res) => console.log(res)));
  });

export const ignoreChars =
  ' \t\r\n~!@#$%^&*()_+-=[]【】、{}|;\':"，。、《》？αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇≈≡≠＝≤≥＜＞≮≯∷±＋－×÷／∫∮∝∞∧∨∑∏∪∩∈∵∴⊥∥∠⌒⊙≌∽√§№☆★○●◎◇◆□℃‰€■△▲※→←↑↓〓¤°＃＆＠＼︿＿￣―♂♀┌┍┎┐┑┒┓─┄┈├┝┞┟┠┡┢┣│┆┊┬┭┮┯┰┱┲┳┼┽┾┿╀╁╂╃└┕┖┗┘┙┚┛━┅┉┤┥┦┧┨┩┪┫┃┇┋┴┵┶┷┸┹┺┻╋╊╉╈╇╆╅╄';

export function getCurrentId() {
  return Number(localStorage.getItem(incrementIdKey));
}

export function setCurrentId(id: number | string) {
  localStorage.setItem(incrementIdKey, id + '');
}

export const indexDB = {
  put<T = any>(items: T[]) {
    console.log({items});
    
    return _searchIndex.PUT(items, {
      tokenizer(tokens, field, ops) {
        
        const {
          SKIP,
          LOWCASE,
          REPLACE,
          NGRAMS,
          STOPWORDS,
          SCORE_TERM_FREQUENCY,
        } = _searchIndex.TOKENIZATION_PIPELINE_STAGES;

        return CUSTOM_SPLIT([tokens, field, ops])
          .then(SKIP as any)
          .then(LOWCASE as any)
          .then(REPLACE as any)
          .then(NGRAMS as any)
          .then(STOPWORDS as any)
          .then(SCORE_TERM_FREQUENCY as any)
          .then(([tokens]) => tokens) as Promise<string>;
      },
    });
  },
  delete(ids: string[]) {
    return _searchIndex.DELETE(...ids);
  },
  all(limit?: number) {
    return _searchIndex.ALL_DOCUMENTS(limit);
  },
  query(query: Token, options?: QueryOptions) {
    return _searchIndex.QUERY(query, options);
  },
  // flush() {
  //   return _searchIndex.FLUSH();
  // },
};

// export class DataDB extends Dexie {
//   // 'locale' is added by dexie when declaring the stores()
//   // We just tell the typing system this is the case
//   locale!: Table<Locale>;

//   constructor() {
//     super(dataDBName);
//     this.version(version).stores({
//       locale: "&id, cn, en, in", // Primary key and indexed props
//     });
//   }
// }

// export const dataDB = new DataDB();
