<script setup lang="ts">
import { openFile, readExcel, nodejiebaCut, decodeCol } from '#preload';
import { computed, reactive } from 'vue';
import { notification } from 'ant-design-vue';
import {
  dataDB,
  getCurrentId,
  ignoreChars,
  indexDB,
  setCurrentId,
} from '../db';
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

/**
 * {name: data[][]}
 */
const sheetsMap: Record<string, string[][]> = {};

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
  importTask: {
    total: 0,
    current: 0,
  },
  selectedRowKeys: [] as number[],
  selectedRows: [] as ImportData[],
});

const hasSelected = computed(() => state.selectedRows.length > 0);

const onSelectChange = (
  selectedRowKeys: number[],
  selectedRows: ImportData[],
) => {
  state.selectedRowKeys = selectedRowKeys;
  state.selectedRows = selectedRows;
};

/**
 * 选择文件导入 excel
 */
const chooseFile = async () => {
  try {
    state.spiningTips = '正在加载 Excel 数据...';
    state.spinning = true;

    const { filePath, fileName } = await openFile();
    if (!filePath) return; // 点击了取消

    const sheets = readExcel(filePath);
    if (sheets) {
      state.sheetBookName = fileName; // 保存 excel 文件名
      sheets.forEach((sheet, index) => {
        const { name } = sheet;
        sheetsMap[name] = sheet.data as string[][]; // 保存 excel 数据

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

/**
 * 导入 excel 数据到数据库中
 * @param data 解析出来的数据
 * @param table 工作表名
 * @param param2 索引s
 */
const importToDB = async (
  data: string[][],
  table: string,
  { cnIndex, enIndex, inIndex, vnIndex, thIndex }: LocaleIndexs,
) => {
  try {
    let currentId = getCurrentId();

    const dataDBList: any[] = [];
    const indexDBList: any[] = [];
    for (const [index, row] of data.entries()) {
      // 0 为标题行
      if (index > 0 && row.length) {
        const cn = row[cnIndex as unknown as number];
        const id = currentId++;
        const indexDBItem = {
          id,
          cn: nodejiebaCut(cn).filter((text) => !ignoreChars.includes(text)),
          en: row[enIndex as unknown as number],
        };

        const dataDBItem: Locale = {
          id,
          cn,
          en: row[enIndex as unknown as number],
          in: inIndex ? row[inIndex as unknown as number] : '',
          vn: vnIndex ? row[vnIndex as unknown as number] : '',
          th: thIndex ? row[thIndex as unknown as number] : '',
          sheet: state.sheetBookName,
          table,
        };

        dataDBList.push(dataDBItem);
        indexDBList.push(indexDBItem);
        state.importTask.total += 1;
      }
    }

    await Promise.all([
      dataDB.locale.bulkAdd(dataDBList),
      indexDB.put(indexDBList),
    ]);

    setCurrentId(currentId);
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  }
};

/**
 * 预导入 excel 数据 检查 CN EN 字母必填
 * @param index
 */
const preImportWorkTable = (importData: ImportData) => {
  const { cnIndex, enIndex, inIndex, thIndex, vnIndex, table } = importData;
  if (cnIndex === '' || enIndex === '') {
    const msg = '请输入中文列和英文列的字母';
    notification.error({ message: msg });
    return Promise.reject(msg);
  }

  return importToDB(sheetsMap[table], state.sheetBookName, {
    cnIndex: decodeCol(cnIndex.toUpperCase()),
    enIndex: decodeCol(enIndex.toUpperCase()),
    inIndex: inIndex ? decodeCol(inIndex.toUpperCase()) : '',
    thIndex: thIndex ? decodeCol(thIndex.toUpperCase()) : '',
    vnIndex: vnIndex ? decodeCol(vnIndex.toUpperCase()) : '',
  });
};

/**
 * 导入选中的工作表数据
 * @param index
 */
const importSelectedTable = async (importData?: ImportData) => {
  try {
    console.time('importToDB');
    state.spiningTips = '正在导入 Excel 数据...';
    state.spinning = true;

    // 导入单个表
    if (importData) {
      await preImportWorkTable(importData);
    } else {
      // 批量导入
      const promiseList = state.selectedRows.map((data) =>
        preImportWorkTable(data),
      );
      await Promise.all(promiseList);
    }

    notification.success({
      message: `本次成功导入${state.importTask.total}条数据`,
    });
    console.timeEnd('importToDB');
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  } finally {
    state.spinning = false;
    state.importTask.total = 0;
    state.importTask.current = 0;
  }
};
</script>

<template>
  <a-spin
    :spinning="state.spinning"
    :tip="state.spiningTips"
  >
    <a-button
      type="primary"
      class="mb-15"
      @click="chooseFile"
    >
      选择要导入的 Excel
    </a-button>

    <a-button
      :disabled="!hasSelected"
      type="primary"
      class="ml-15 mb-15"
      @click="() => importSelectedTable()"
    >
      导入选中的工作表数据
    </a-button>

    <a-table
      :pagination="false"
      :bordered="true"
      :columns="columns"
      :data-source="state.dataSource"
      :row-selection="{
        selectedRowKeys: state.selectedRowKeys,
        onChange: onSelectChange,
      }"
      :row-key="(row:Locale)=>row.sheet+'-'+row.table"
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
          <a-button @click="importSelectedTable(state.dataSource[index])">
            导入数据
          </a-button>
        </template>
      </template>
    </a-table>
  </a-spin>
</template>
