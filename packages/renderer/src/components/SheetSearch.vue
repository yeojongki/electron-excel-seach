<script setup lang="ts">
import { reactive } from 'vue';
import { db, Locale } from '../db';

const columns = [
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
    title: '文件名',
    dataIndex: 'sheet',
    width: 150,
  },
  {
    title: '工作表名',
    dataIndex: 'table',
    width: 100,
  },
  {
    title: '操作',
    dataIndex: 'action',
  },
];

const state = reactive({
  dataSource: [] as Locale[],
  form: {
    cn: '',
    en: '',
    in: '',
    sheet: '',
    table: '',
  },
});

db.locale.toArray().then((res) => {
  state.dataSource = res;
});

const onFinish = async () => {
  if (state.form.cn) {
    const result = await db.locale
      .filter((item) => item.cn.includes(state.form.cn))
      .toArray();
    state.dataSource = result;
  }
};

const reset = async () => {
  const result = await db.locale.toArray();
  state.dataSource = result;
};
</script>

<template>
  <a-form
    :model="state.form"
    :label-col="{ span: 8 }"
    :wrapper-col="{ span: 16 }"
    autocomplete="off"
    @finish="onFinish"
  >
    <a-form-item
      label="中文"
      name="cn"
    >
      <a-input v-model:value="state.form.cn" />
    </a-form-item>

    <!-- <a-form-item label="英文" name="en">
      <a-input v-model:value="state.form.en" />
    </a-form-item>

    <a-form-item label="印尼" name="in">
      <a-input v-model:value="state.form.in" />
    </a-form-item> -->

    <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
      <a-button
        type="primary"
        html-type="submit"
      >
        搜索
      </a-button>
    </a-form-item>

    <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
      <a-button
        html-type="reset"
        @click="reset"
      >
        重置
      </a-button>
    </a-form-item>
  </a-form>

  <a-table
    :pagination="false"
    :bordered="true"
    :columns="columns"
    :data-source="state.dataSource"
  >
    <template #bodyCell="{ column, text }">
      <template v-if="column.dataIndex === 'cn'">
        {{ text }}
      </template>

      <template v-if="column.dataIndex === 'en'">
        {{ text }}
      </template>

      <template v-if="column.dataIndex === 'in'">
        {{ text }}
      </template>
    </template>
  </a-table>
</template>
