<script setup lang="ts">
import { reactive, ref } from 'vue';
import { FormInstance, message } from 'ant-design-vue';
import { notification } from 'ant-design-vue';
import { indexDB, Locale, ignoreChars } from '../db';
import { nodejieba } from '#preload';
import CopyableText from './CopyableText.vue';

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

const formatResult = (
  result: { _doc: Locale; _match: { SCORE: string }[] }[],
) =>
  result
    // 匹配得分越多排越前
    .sort((a, b) => {
      const aScore = a._match.reduce((prev, next) => prev + +next.SCORE, 0);
      const bScore = b._match.reduce((prev, next) => prev + +next.SCORE, 0);
      return bScore - aScore;
    })
    .map((item) => {
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

const onFinish = async () => {
  const { field } = state.form;
  const keyword = state.form.keyword.trim();
  if (!keyword.length) {
    state.dataSource = [];
    return;
  }
  console.time('【search】');
  try {
    state.spinning = true;
    // 分词搜索
    const searchQuery =
      field === 'cn'
        ? nodejieba
            .cutAll(keyword)
            .filter((text) => !ignoreChars.includes(text))
            .map((text) => `${field}:${text}`)
        : field === 'en' || field === 'in'
        ? nodejieba
            .cutHMM(keyword)
            .filter((text) => !ignoreChars.includes(text))
            .map((text) => `${field}:${text}`)
        : [`${field}:${keyword}`];

    console.log(`【searchQuery】: ${searchQuery}`);
    const { RESULT } = await indexDB.query(
      {
        OR: searchQuery,
      },
      { DOCUMENTS: true },
    );
    console.log(RESULT);

    state.dataSource = formatResult(RESULT as any);
    RESULT.length && message.success(`共找到${RESULT.length}条数据`);
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
// const initData = async () => {
//   try {
//     console.time("【all】");
//     state.spinning = true;
//     const data = await indexDB.all();
//     state.allData = formatResult(data as any);
//     state.spinning = false;
//     console.timeEnd("【all】");
//   } catch (error) {
//     notification.error({
//       message: (error as any).message || JSON.stringify(error),
//     });
//   } finally {
//     state.spinning = false;
//   }
// };
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
