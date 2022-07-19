import { ipcRenderer } from 'electron';
import xlsx from 'node-xlsx';
import * as nodejieba from 'nodejieba';
import * as fs from 'fs';

/**
 * @module preload
 */

export { sha256sum } from './nodeCrypto';
export { versions } from './versions';

export function nodejiebaCut(sentence: string) {
  return nodejieba.cut(sentence);
}

export function openFile() {
  return ipcRenderer.invoke('dialog:openFile');
}

export function readExcel(path: string) {
  try {
    const workSheetsFromBuffer = xlsx.parse(fs.readFileSync(path));
    return workSheetsFromBuffer;
  } catch (error) {
    alert('解析 excel 失败, 请检查格式是否正确');
  }
}
