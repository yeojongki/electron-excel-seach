<script setup lang="ts">
import { openFile, readExcel } from '#preload';
import { reactive } from 'vue';
import { db, Locale } from '../db';

let currentSheets: { name: string; data: string[][] }[] = [];

const columns = [
  {
    title: '工作表名',
    dataIndex: 'name',
  },
  {
    title: '中文列索引',
    dataIndex: 'cnIndex',
  },
  {
    title: '英文列索引',
    dataIndex: 'enIndex',
  },
  {
    title: '印尼列索引',
    dataIndex: 'inIndex',
  },
  {
    title: '操作',
    dataIndex: 'action',
  },
];

const state = reactive({
  sheetBookName: '', // 当前工作簿名
  dataSource: [] as {
    name: string;
    cnIndex: string;
    enIndex: string;
    inIndex?: string;
  }[],
});

const chooseFile = async () => {
  const { filePath, fileName } = await openFile();
  if (!filePath) return; // 点击了取消

  const sheets = readExcel(filePath);
  if (sheets) {
    state.sheetBookName = fileName; // 保存 excel 文件名
    currentSheets = sheets as any; // 保存 excel 数据

    sheets.forEach((sheet, index) => {
      const { name } = sheet;
      state.dataSource[index] = {
        name: name,
        cnIndex: '',
        enIndex: '',
        inIndex: '',
      };
    });
  }
};

const importWorkTable = async (
  data: string[][],
  sheetTable: string,
  {
    cnIndex,
    enIndex,
    inIndex,
  }: { cnIndex: string; enIndex: string; inIndex?: string },
) => {
  const result: Locale[] = [];

  data.forEach((row, index) => {
    // 0 为标题行
    if (index > 0 && row.length) {
      const item: Locale = {
        cn: row[cnIndex as unknown as number],
        en: row[enIndex as unknown as number],
        in: inIndex ? row[inIndex as unknown as number] : '',
        sheet: state.sheetBookName,
        table: sheetTable,
      };
      result.push(item);
    }
  });

  await db.locale.bulkAdd(result);
  alert(`本次成功导入${result.length}条数据`);
};

const preImportWorkTable = (index: number) => {
  const { cnIndex, enIndex, inIndex } = state.dataSource[index];
  if (cnIndex === '' || enIndex === '') {
    alert('请输入中文列和英文列的索引');
    return;
  }

  importWorkTable(currentSheets[index].data, currentSheets[index].name, {
    cnIndex,
    enIndex,
    inIndex,
  });
};
</script>

<template>
  <a-button
    style="margin-bottom: 15px"
    @click="chooseFile"
  >
    选择文件
  </a-button>

  <a-table
    :pagination="false"
    :bordered="true"
    :columns="columns"
    :data-source="state.dataSource"
  >
    <template #bodyCell="{ column, index }">
      <template v-if="column.dataIndex === 'cnIndex'">
        <a-input-number
          v-model:value="state.dataSource[index].cnIndex"
          :min="0"
        />
      </template>

      <template v-if="column.dataIndex === 'enIndex'">
        <a-input-number
          v-model:value="state.dataSource[index].enIndex"
          :min="0"
        />
      </template>

      <template v-if="column.dataIndex === 'inIndex'">
        <a-input-number
          v-model:value="state.dataSource[index].inIndex"
          :min="0"
        />
      </template>

      <template v-if="column.dataIndex === 'action'">
        <a-button @click="preImportWorkTable(index)">
          导入数据
        </a-button>
      </template>
    </template>
  </a-table>
</template>
