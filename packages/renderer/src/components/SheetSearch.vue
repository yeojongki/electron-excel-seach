<script setup lang="ts">
import { reactive, ref } from 'vue';
import { FormInstance, message } from 'ant-design-vue';
import { notification } from 'ant-design-vue';
import { indexDB, dataDB, Locale, ignoreChars } from '../db';
import { nodejiebaCut } from '#preload';
import CopyableText from './CopyableText.vue';

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
    field: 'cn' as 'cn' | 'en' | 'in' | 'th' | 'vn',
    keyword: '',
  },
});

const onFinish = async () => {
  const { field } = state.form;
  const keyword = state.form.keyword.trim();
  if (!keyword) return;
  console.time('【search】');
  try {
    state.spinning = true;
    // 大于2个字符的中英文走索引数据库找ID
    if ((field === 'cn' || field === 'en') && keyword.length > 1) {
      const { RESULT } = await indexDB.query(
        {
          OR: nodejiebaCut(keyword)
            .filter((text) => !ignoreChars.includes(text))
            .map((text) => `${field}:${text}`),
        },
        { DOCUMENTS: true },
      );

      const ids = RESULT.map((item) => (item as any)._doc.id);
      const datas = await dataDB.locale.bulkGet(ids);
      state.dataSource = datas as Locale[];
      RESULT.length && message.success(`共找到${RESULT.length}条数据`);
      // console.log({ RESULT, datas });
    } else {
      // 走普通的数据库找数据
      const RESULT = await dataDB.locale.filter((item) => {
        const fieldVal = item[field] + ''; // 转字符串避免是数字
        if (fieldVal) {
          return fieldVal.includes(keyword);
        }
        return false;
      });
      const datas = await RESULT.toArray();
      state.dataSource = datas;
      datas?.length && message.success(`共找到${datas.length}条数据`);
      // console.log({ datas });
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
