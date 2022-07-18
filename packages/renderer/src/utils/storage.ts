export const importHisoryKey = 'IMPORT_HISTORY';

export function setImportHistory({
  table,
  book,
}: {
  table: string;
  book: string;
}) {
  const fromStorage = localStorage.getItem(importHisoryKey);
  const history: { [k: string]: string[] } = fromStorage
    ? JSON.parse(fromStorage)
    : {};

  if (!history[book]) {
    history[book] = [];
  }

  if (!history[book].includes(table)) {
    history[book].push(table);
  }

  localStorage.setItem(importHisoryKey, JSON.stringify(history));
}

export function getImportHistory() {
  const fromStorage = localStorage.getItem(importHisoryKey);
  const history: { [k: string]: string[] } = fromStorage
    ? JSON.parse(fromStorage)
    : {};
  return history;
}

export function deleteImportHistory(book: string, table?: string[]) {
  const fromStorage = localStorage.getItem(importHisoryKey);
  const history: { [k: string]: string[] } = fromStorage
    ? JSON.parse(fromStorage)
    : {};

  if (!history[book]) throw new Error(`非法删除, 不存在工作簿${book}`);

  // 删除某个工作簿
  if (table?.length) {
    const tableMap = table.reduce((prev, next) => {
      prev[next] = next;
      return prev;
    }, {} as Record<string, string>);

    history[book] = history[book].filter((item) => item !== tableMap[item]);
  } else {
    // 删除工作簿下的某个工作表
    delete history[book];
  }

  localStorage.setItem(importHisoryKey, JSON.stringify(history));
}
