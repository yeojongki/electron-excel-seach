import Dexie, { Table } from 'dexie';

export interface Locale {
  id?: number;
  cn: string;
  en: string;
  in: string;
  sheet: string;
  table: string;
}

const dbName = '9708_excel_locale';
export class LocaleDexie extends Dexie {
  // 'locale' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  locale!: Table<Locale>;

  constructor() {
    super(dbName);
    this.version(1).stores({
      locale: '++id, cn, en, in', // Primary key and indexed props
    });
  }
}

export const db = new LocaleDexie();
