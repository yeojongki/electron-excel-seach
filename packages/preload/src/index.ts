import { ipcRenderer, clipboard } from 'electron';
import xlsx from 'node-xlsx';
import { utils } from 'xlsx';
import * as nodejieba from '@node-rs/jieba';
import * as fs from 'fs';

/**
 * @module preload
 */

export { sha256sum } from './nodeCrypto';
export { versions } from './versions';

export { nodejieba };

export function openFile() {
  return ipcRenderer.invoke('dialog:openFile');
}

export function decodeCol(col: string) {
  return utils.decode_col(col) + '';
}

export function readExcel(path: string) {
  try {
    const workSheetsFromBuffer = xlsx.parse(fs.readFileSync(path));
    return workSheetsFromBuffer;
  } catch (error) {
    alert('解析 excel 失败, 请检查格式是否正确');
  }
}

export function copyText(text: string) {
  return clipboard.writeText(text);
}
