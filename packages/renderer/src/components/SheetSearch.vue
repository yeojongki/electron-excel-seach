<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { FormInstance, message } from 'ant-design-vue';
import { notification } from 'ant-design-vue';
import { query, Locale, ignoreChars } from '../db';
import { nodejiebaCut } from '#preload';
import CopyableText from './CopyableText.vue';
import { QueryResultItem, QueryResultItemNoDoc } from 'types/search-index';

const formRef = ref<FormInstance>();

const state = reactive({
  spinning: false,
  dataSource: [] as Locale[],
  columns: [
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
      title: '工作簿',
      dataIndex: 'sheet',
    },
    {
      title: '工作表',
      dataIndex: 'table',
    },
    {
      title: '操作',
      dataIndex: 'action',
    },
  ],
  form: {
    field: 'cn',
    keyword: '',
  },
});

const formatResult = (result: QueryResultItem[] | QueryResultItemNoDoc[]) =>
  result.map((item) => {
    const locale = (item as any)._doc as Locale;
    return {
      cn: locale.cn,
      en: locale.en,
      in: locale.in,
      th: locale.th,
      vn: locale.vn,
      table: locale.table,
      sheet: locale.sheet,
    };
  });


const FIELD = computed(() =>
  state.form.field === 'cn' ? 'idx' : state.form.field,
);

const onFinish = async () => {
  if (state.form.keyword) {
    try {
      state.spinning = true;
      const { RESULT, RESULT_LENGTH } = await query(
        {
          // FIELD: FIELD.value,
          OR: nodejiebaCut(state.form.keyword)
            .filter((text) => !ignoreChars.includes(text))
            .map((text) => `${FIELD.value}:${text}`),
        },
        { DOCUMENTS: true },
      );
      console.log(RESULT);
      state.dataSource = formatResult(RESULT);
      RESULT_LENGTH && message.success(`共找到${RESULT_LENGTH}条数据`);
    } catch (error) {
      notification.error({
        message: (error as any)?.message || JSON.stringify(error),
      });
    } finally {
      state.spinning = false;
    }
  }
};

/**
 * 重置清空数据
 */
const reset = async () => {
  formRef.value?.resetFields();
  state.dataSource = [];
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
        <template v-if="column.dataIndex === 'cn'">
          <div>
            <CopyableText
              :text="text"
              class="long-text"
            />
          </div>
        </template>

        <template v-if="column.dataIndex === 'en'">
          <div>
            <CopyableText
              :text="text"
              class="long-text"
            />
          </div>
        </template>

        <template v-if="column.dataIndex === 'in'">
          <div>
            <CopyableText
              :text="text"
              class="long-text"
            />
          </div>
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
