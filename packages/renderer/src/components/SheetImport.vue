<script setup lang="ts">
import { openFile, readExcel, nodejieba, decodeCol } from '#preload';
import { computed, reactive } from 'vue';
import { notification } from 'ant-design-vue';
import { ignoreChars, indexDB } from '../db';
import type { Locale } from '../db';

interface LocaleIndexs {
  cnIndex: string;
  enIndex: string;
  inIndex?: string;
  thIndex?: string;
  vnIndex?: string;
}

interface SheetTableData extends LocaleIndexs {
  book: string;
  table: string;
}

/**
 * {sheetTableName: data[][]}
 */
const workTableMap: Record<string, string[][]> = {};

const columns = [
  {
    title: '项目名',
    dataIndex: 'book',
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
  dataSource: [] as SheetTableData[],
  importTask: {
    total: 0,
    current: 0,
  },
  selectedRowKeys: [] as number[],
  selectedRows: [] as SheetTableData[],
});

const hasSelected = computed(() => state.selectedRows.length > 0);

const onSelectChange = (
  selectedRowKeys: number[],
  selectedRows: SheetTableData[],
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
        workTableMap[name] = sheet.data as string[][]; // 保存 excel 数据

        state.dataSource[index] = {
          book: fileName,
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
 * 获取单元格的值
 * @param data
 * @param index
 */
const getCellText = (data: string[], index?: string) => {
  let result = '';
  if (index) {
    const text = data[index as unknown as number];
    if (text) result = text;
  }

  return result.toString().split('\n');
};

/**
 * 导入 excel 数据 检查 CN EN 字母必填
 * @param index
 */
const importToDB = async (sheetTableDatas: SheetTableData[]) => {
  try {
    const toImportDatas: Locale[] = [];
    for (let i = 0; i < sheetTableDatas.length; i++) {
      const sheetTableData = sheetTableDatas[i];
      const { cnIndex, enIndex, inIndex, thIndex, vnIndex, book, table } =
        sheetTableData;
      if (cnIndex === '' || enIndex === '') {
        const msg = `【${book} - ${table}】请输入中文列和英文列的字母`;
        return Promise.reject(msg);
      }
      const indexs: LocaleIndexs = {
        cnIndex: decodeCol(cnIndex.toUpperCase()),
        enIndex: decodeCol(enIndex.toUpperCase()),
        inIndex: inIndex ? decodeCol(inIndex.toUpperCase()) : '',
        thIndex: thIndex ? decodeCol(thIndex.toUpperCase()) : '',
        vnIndex: vnIndex ? decodeCol(vnIndex.toUpperCase()) : '',
      };

      const tableData = workTableMap[table];
      tableData.forEach((data, dataIndex) => {
        // dataIndex 为 `0` 是列标题
        if (data.length && dataIndex > 0) {
          // cn 单元格的值可能会有 \n 换行 需要分割出新的一条
          const cnText = getCellText(data, indexs.cnIndex);
          const enText = getCellText(data, indexs.enIndex);
          const inText = getCellText(data, indexs.inIndex);
          const vnText = getCellText(data, indexs.vnIndex);
          const thText = getCellText(data, indexs.thIndex);

          cnText.forEach((cn, idx) => {
            const dataDBItem: Locale = {
              idx: nodejieba
                .cutAll(cn)
                .filter((text) => !ignoreChars.includes(text)),
              cn,
              en: enText[idx],
              in: inText[idx] ?? '',
              vn: vnText[idx] ?? '',
              th: thText[idx] ?? '',
              book: state.sheetBookName,
              table,
            };
            toImportDatas.push(dataDBItem);
          });
        }
      });
    }

    console.log(toImportDatas);
    state.importTask.total = toImportDatas.length;
    await indexDB.put(toImportDatas);
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  }
};

/**
 * 导入选中的工作表数据
 * @param index
 */
const importSelectedTable = async (sheetTableDatas: SheetTableData[]) => {
  try {
    console.time('importToDB');
    state.spiningTips = '正在导入 Excel 数据...';
    state.spinning = true;

    await importToDB(sheetTableDatas);
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
    id="sppp"
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
      @click="() => importSelectedTable(state.selectedRows)"
    >
      导入选中的工作表数据
    </a-button>

    <a-table
      :pagination="false"
      :bordered="true"
      :columns="columns"
      :sticky="true"
      :data-source="state.dataSource"
      :row-selection="{
        selectedRowKeys: state.selectedRowKeys,
        onChange: onSelectChange,
      }"
      :row-key="(row:Locale)=>row.book+'-'+row.table"
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
          <a-button
            class="auto-height-link-btn"
            type="link"
            @click="importSelectedTable([state.dataSource[index]])"
          >
            导入数据
          </a-button>
        </template>
      </template>
    </a-table>
  </a-spin>
</template>

<style scoped>
:deep(.ant-table-sticky-scroll) {
  display: none;
}
.auto-height-link-btn {
  white-space: normal;
  word-break: break-word;
  height: auto;
}
</style>
