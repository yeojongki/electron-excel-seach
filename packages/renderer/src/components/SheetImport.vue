<script setup lang="ts">
import { openFile, readExcel, nodejiebaCut, decodeCol } from '#preload';
import { reactive } from 'vue';
import { notification } from 'ant-design-vue';
import { ignoreChars, put } from '../db';
import type { Locale } from '../db';

interface LocaleIndexs {
  cnIndex: string;
  enIndex: string;
  inIndex?: string;
  thIndex?: string;
  vnIndex?: string;
}

interface ImportData extends LocaleIndexs {
  sheet: string;
  table: string;
}

let currentSheets: { name: string; data: string[][] }[] = [];

const columns = [
  {
    title: '项目名',
    dataIndex: 'sheet',
  },
  {
    title: '工作表名',
    dataIndex: 'table',
  },
  {
    title: '中文列字母',
    dataIndex: 'cnIndex',
  },
  {
    title: '英文列字母',
    dataIndex: 'enIndex',
  },
  {
    title: '印尼列字母',
    dataIndex: 'inIndex',
  },
  {
    title: '泰文列字母',
    dataIndex: 'thIndex',
  },
  {
    title: '越南列字母',
    dataIndex: 'vnIndex',
  },
  {
    title: '操作',
    dataIndex: 'action',
  },
];

const state = reactive({
  spinning: false,
  spiningTips: '',
  sheetBookName: '', // 当前工作簿名
  dataSource: [] as ImportData[],
});

const chooseFile = async () => {
  try {
    state.spiningTips = '正在加载 Excel 数据...';
    state.spinning = true;
    
    const { filePath, fileName } = await openFile();
    if (!filePath) return; // 点击了取消

    const sheets = readExcel(filePath);
    if (sheets) {
      state.sheetBookName = fileName; // 保存 excel 文件名
      currentSheets = sheets as any; // 保存 excel 数据

      sheets.forEach((sheet, index) => {
        const { name } = sheet;
        state.dataSource[index] = {
          sheet: fileName,
          table: name,
          cnIndex: '',
          enIndex: '',
          inIndex: '',
          thIndex: '',
          vnIndex: '',
        };
      });
    }
  } catch (error) {
    alert(error);
  } finally {
    state.spinning = false;
  }
};

const importWorkTable = async (
  data: string[][],
  sheetTable: string,
  { cnIndex, enIndex, inIndex, vnIndex, thIndex }: LocaleIndexs,
) => {
  try {
    state.spiningTips = '正在导入 Excel 数据...';
    state.spinning = true;
    const result: Locale[] = [];

    for (const [index, row] of data.entries()) {
      // 0 为标题行
      if (index > 0 && row.length) {
        const cn = row[cnIndex as unknown as number];
        const item: Locale = {
          idx: nodejiebaCut(cn).filter((text) => !ignoreChars.includes(text)),
          cn,
          en: row[enIndex as unknown as number],
          in: inIndex ? row[inIndex as unknown as number] : '',
          vn: vnIndex ? row[vnIndex as unknown as number] : '',
          th: thIndex ? row[thIndex as unknown as number] : '',
          sheet: state.sheetBookName,
          table: sheetTable,
        };
        result.push(item);
      }
    }

    await put(result);
    notification.success({ message: `本次成功导入${result.length}条数据` });
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  } finally {
    state.spinning = false;
  }
};

/**
 * 预导入 excel 数据 检查 CN EN 字母必填
 * @param index
 */
const preImportWorkTable = (index: number) => {
  const { cnIndex, enIndex, inIndex, thIndex, vnIndex } =
    state.dataSource[index];

  if (cnIndex === '' || enIndex === '') {
    notification.error({ message: '请输入中文列和英文列的字母' });
    return;
  }

  importWorkTable(currentSheets[index].data, currentSheets[index].name, {
    cnIndex: decodeCol(cnIndex.toUpperCase()),
    enIndex: decodeCol(enIndex.toUpperCase()),
    inIndex: inIndex ? decodeCol(inIndex.toUpperCase()) : '',
    thIndex: thIndex ? decodeCol(thIndex.toUpperCase()) : '',
    vnIndex: vnIndex ? decodeCol(vnIndex.toUpperCase()) : '',
  });
};
</script>

<template>
  <a-spin
    :spinning="state.spinning"
    :tip="state.spiningTips"
  >
    <a-button
      type="primary"
      style="margin-bottom: 15px"
      @click="chooseFile"
    >
      选择要导入的 Excel
    </a-button>

    <a-table
      :pagination="false"
      :bordered="true"
      :columns="columns"
      :data-source="state.dataSource"
    >
      <template #bodyCell="{ column, index }">
        <template v-if="column.dataIndex === 'cnIndex'">
          <a-input v-model:value="state.dataSource[index].cnIndex" />
        </template>

        <template v-if="column.dataIndex === 'enIndex'">
          <a-input v-model:value="state.dataSource[index].enIndex" />
        </template>

        <template v-if="column.dataIndex === 'inIndex'">
          <a-input v-model:value="state.dataSource[index].inIndex" />
        </template>

        <template v-if="column.dataIndex === 'vnIndex'">
          <a-input v-model:value="state.dataSource[index].vnIndex" />
        </template>

        <template v-if="column.dataIndex === 'thIndex'">
          <a-input v-model:value="state.dataSource[index].thIndex" />
        </template>

        <template v-if="column.dataIndex === 'action'">
          <a-button @click="preImportWorkTable(index)">
            导入数据
          </a-button>
        </template>
      </template>
    </a-table>
  </a-spin>
</template>
