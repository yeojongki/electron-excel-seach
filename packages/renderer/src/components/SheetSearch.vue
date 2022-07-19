<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { notification } from 'ant-design-vue';
import { query, Locale } from '../db';
import { nodejiebaCut } from '#preload';

const formRef = ref<FormInstance>();

const state = reactive({
  spinning: false,
  dataSource: [] as Locale[],
  columns: [
    {
      title: '中文',
      dataIndex: 'cn',
      width: 150,
    },
    {
      title: '英文',
      dataIndex: 'en',
      width: 150,
    },
    {
      title: '印尼',
      dataIndex: 'in',
      width: 150,
    },
    {
      title: '文件名',
      dataIndex: 'sheet',
    },
    {
      title: '工作表名',
      dataIndex: 'table',
    },
    {
      title: '操作',
      dataIndex: 'action',
    },
  ],
  form: {
    cn: '',
    en: '',
    in: '',
    sheet: '',
    table: '',
  },
});

const onFinish = async () => {
  if (state.form.cn) {
    try {
      state.spinning = true;
      // const result = await db.locale
      //   .filter((item) => item.cn.includes(state.form.cn))
      //   .toArray();
      const { RESULT, RESULT_LENGTH } = await query(
        nodejiebaCut(state.form.cn),
      );
      console.log(RESULT_LENGTH);

      state.dataSource = RESULT.map((item) => {
        const locale = (item as any)._doc as Locale;
        return {
          cn: locale.cn,
          en: locale.en,
          in: locale.in,
          table: locale.table,
          sheet: locale.sheet,
        };
      });
    } catch (error) {
      notification.error((error as any)?.message || JSON.stringify(error));
    } finally {
      state.spinning = false;
    }
  }
};

const reset = async () => {
  formRef.value?.resetFields();
  state.dataSource = [];
  // const result = await db.locale.toArray();
  // state.dataSource = result;
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
      <a-form-item
        label="中文"
        name="cn"
      >
        <a-input
          v-model:value="state.form.cn"
          style="width: 200px"
        />
      </a-form-item>

      <!-- <a-form-item label="英文" name="en">
      <a-input v-model:value="state.form.en" />
    </a-form-item>

    <a-form-item label="印尼" name="in">
      <a-input v-model:value="state.form.in" />
    </a-form-item> -->

      <a-form-item>
        <a-button
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
      </a-form-item>
    </a-form>

    <a-table
      :pagination="false"
      :bordered="true"
      :columns="state.columns"
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
  </a-spin>
</template>
