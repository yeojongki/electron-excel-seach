<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { FormInstance, message } from 'ant-design-vue';
import { notification } from 'ant-design-vue';
import { indexDB, Locale, ignoreChars } from '../db';
import { nodejieba } from '#preload';
import CopyableText from './CopyableText.vue';
import { QueryResultItem } from 'types/search-index';

const formRef = ref<FormInstance>();

const state = reactive({
  spinning: false,
  allData: [] as Locale[],
  dataSource: [] as Locale[],
  columns: [
    {
      title: '工作簿',
      dataIndex: 'book',
    },
    {
      title: '工作表',
      dataIndex: 'table',
    },
    {
      title: '中文',
      dataIndex: 'cn',
    },
    {
      title: '英文',
      dataIndex: 'en',
    },
    {
      title: '印尼',
      dataIndex: 'in',
    },
    {
      title: '泰文',
      dataIndex: 'th',
    },
    {
      title: '越南',
      dataIndex: 'vn',
    },
    {
      title: '操作',
      dataIndex: 'action',
    },
  ],
  form: {
    field: 'cn' as 'cn' | 'en' | 'in' | 'th' | 'vn',
    keyword: '',
  },
});

const formatResult = (result: { _doc: any }[]) =>
  result.map((item) => {
    const locale = (item as any)._doc as Locale;
    return {
      idx: item._doc.idx,
      cn: locale.cn,
      en: locale.en,
      in: locale.in,
      th: locale.th,
      vn: locale.vn,
      table: locale.table,
      book: locale.book,
    };
  });

const FIELD = computed(() =>
  state.form.field === 'cn' && state.form.keyword.length > 1
    ? 'idx'
    : state.form.field,
);

const onFinish = async () => {
  const keyword = state.form.keyword.trim();
  console.time('【search】');
  try {
    state.spinning = true;
    if (keyword.length > 1) {
      // 大于1个字符的中文先分词
      const searchQuery =
        FIELD.value === 'cn'
          ? nodejieba
              .cutAll(keyword)
              .filter((text) => !ignoreChars.includes(text))
              .map((text) => `${FIELD.value}:${text}`)
          : FIELD.value === 'en'
          ? nodejieba
              .cutHMM(keyword)
              .filter((text) => !ignoreChars.includes(text))
              .map((text) => `${FIELD.value}:${text}`)
          : [`${FIELD.value}:${keyword}`];

      console.log(`【searchQuery】: ${searchQuery}`);
      const { RESULT } = await indexDB.query(
        {
          OR: searchQuery,
        },
        { DOCUMENTS: true },
      );
      console.log(RESULT);

      state.dataSource = formatResult(RESULT as QueryResultItem[]);
      RESULT.length && message.success(`共找到${RESULT.length}条数据`);
      // console.log({ RESULT, datas });
    } else {
      if (!state.allData.length) {
        await initData();
      }
      state.dataSource = state.allData.filter((item) =>
        item[FIELD.value]?.includes(keyword),
      );
    }
    console.timeEnd('【search】');
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  } finally {
    state.spinning = false;
  }
};

/**
 * 重置清空数据
 */
const reset = async () => {
  formRef.value?.resetFields();
  state.dataSource = [];
};

/**
 * 初始化所有数据
 */
const initData = async () => {
  try {
    console.time('【all】');
    state.spinning = true;
    const data = await indexDB.all();
    state.allData = formatResult(data);
    state.spinning = false;
    console.timeEnd('【all】');
  } catch (error) {
    notification.error({
      message: (error as any).message || JSON.stringify(error),
    });
  } finally {
    state.spinning = false;
  }
};
</script>

<template>
  <a-spin :spinning="state.spinning">
    <a-form
      ref="formRef"
      :model="state.form"
      layout="inline"
      autocomplete="off"
      class="mb-15"
      @finish="onFinish"
    >
      <a-select v-model:value="state.form.field">
        <a-select-option value="cn">
          中文
        </a-select-option>
        <a-select-option value="en">
          英文
        </a-select-option>
        <a-select-option value="in">
          印尼
        </a-select-option>
        <a-select-option value="th">
          泰文
        </a-select-option>
        <a-select-option value="vn">
          越南
        </a-select-option>
      </a-select>
      <a-input
        v-model:value="state.form.keyword"
        placeholder="请输入关键词"
        style="width: 200px"
      />

      <a-button
        class="ml-15"
        type="primary"
        html-type="submit"
      >
        搜索
      </a-button>
      <a-button
        class="ml-15"
        html-type="reset"
        @click="reset"
      >
        重置
      </a-button>
    </a-form>

    <a-table
      :pagination="false"
      :bordered="true"
      :columns="state.columns"
      :data-source="state.dataSource"
    >
      <template #bodyCell="{ column, text }">
        <template
          v-if="
            column.dataIndex === 'cn' ||
              column.dataIndex === 'en' ||
              column.dataIndex === 'in' ||
              column.dataIndex === 'vn' ||
              column.dataIndex === 'th'
          "
        >
          <CopyableText
            :text="text"
            class="long-text"
          />
        </template>
      </template>
    </a-table>
  </a-spin>
</template>

<style scoped>
.long-text {
  max-width: 400px;
  display: inline-block;
}
</style>
