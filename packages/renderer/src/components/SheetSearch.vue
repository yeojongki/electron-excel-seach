<script setup lang="ts">
import { reactive, ref } from 'vue';
import { FormInstance, message, Modal, notification } from 'ant-design-vue';
import {
  StarFilled,
  StarOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { indexDB, Locale, ignoreChars } from '../db';
import { nodejieba } from '#preload';
import CopyableText from './CopyableText.vue';

const formRef = ref<FormInstance>();

const state = reactive({
  showAddModal: false,
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
  addForm: {
    cn: '',
    en: '',
    in: '',
    th: '',
    vn: '',
    book: '',
    table: '',
    like: '0',
  },
  form: {
    field: 'cn' as 'cn' | 'en' | 'in' | 'th' | 'vn',
    keyword: '',
    like: '0',
  },
});

/**
 * 格式化 search-index 搜索结果
 * @param result
 */
const formatResult = (
  result: { _doc: Locale; _id: string; _match: { SCORE: string }[] }[],
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
        docId: item._id,
        cn: locale.cn,
        en: locale.en,
        in: locale.in,
        th: locale.th,
        vn: locale.vn,
        table: locale.table,
        book: locale.book,
        like: locale.like,
      };
    });

const onFinish = async () => {
  try {
    console.time('【search】');
    const { field } = state.form;
    const keyword = state.form.keyword.trim();
    if (!keyword.length) {
      if (state.form.like === '1') {
        const { RESULT } = await indexDB.query(
          {
            AND: ['like:1'],
          },
          { DOCUMENTS: true },
        );
        state.dataSource = formatResult(RESULT as any);
        RESULT.length && message.success(`共找到${RESULT.length}条数据`);
      } else {
        state.dataSource = [];
      }
      return;
    }

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
        AND: [
          `like:${state.form.like}`,
          {
            OR: searchQuery,
          },
        ],
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
 * 删除
 * @param docId
 */
const onDelete = async (docId: string) => {
  Modal.confirm({
    title: '确定删除吗?',
    async onOk() {
      await indexDB.delete([docId]);
      onFinish(); // 刷新列表
    },
  });
};

/**
 * 星标/取消星标
 * @param data
 * @param like
 */
const onLike = async (data: Locale, like: '0' | '1') => {
  const { docId, ...rest } = data;
  const item = {
    ...rest,
    like,
  };

  try {
    await indexDB.delete([docId!]);
    await indexDB.put([item]);
  } catch (error) {
    notification.error({
      message: (error as any)?.message || JSON.stringify(error),
    });
  }
  onFinish(); // 刷新列表
};

const addFormRef = ref<FormInstance>();

/**
 * 点击确认
 */
const onAddFormOk = async () => {
  await addFormRef.value?.validateFields();
  const item = { ...state.addForm };

  await indexDB.put([item]);
  message.success('添加成功');

  await addFormRef.value?.resetFields();
  state.showAddModal = false;
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
    <!-- 新增词组弹窗 -->
    <a-modal
      v-model:visible="state.showAddModal"
      title="新增词组"
      ok-text="确定"
      cancel-text="取消"
      @ok="onAddFormOk"
    >
      <a-form
        ref="addFormRef"
        autocomplete="off"
        :model="state.addForm"
        layout="horizontal"
      >
        <a-form-item
          label="中文"
          name="cn"
          :rules="[{ required: true, message: '必填' }]"
        >
          <a-input v-model:value="state.addForm.cn" />
        </a-form-item>

        <a-form-item
          label="英文"
          name="en"
          :rules="[{ required: true, message: '必填' }]"
        >
          <a-input v-model:value="state.addForm.en" />
        </a-form-item>

        <a-form-item
          label="印尼"
          name="in"
        >
          <a-input v-model:value="state.addForm.in" />
        </a-form-item>

        <a-form-item
          label="泰文"
          name="th"
        >
          <a-input v-model:value="state.addForm.th" />
        </a-form-item>

        <a-form-item
          label="越南"
          name="vn"
        >
          <a-input v-model:value="state.addForm.vn" />
        </a-form-item>

        <a-form-item
          label="工作簿"
          name="table"
        >
          <a-input v-model:value="state.addForm.table" />
        </a-form-item>

        <a-form-item
          label="工作表"
          name="table"
        >
          <a-input v-model:value="state.addForm.table" />
        </a-form-item>

        <a-form-item
          label="是否星标"
          name="like"
        >
          <a-switch
            v-model:checked="state.addForm.like"
            un-checked-value="0"
            checked-value="1"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 搜索表单 -->
    <a-form
      ref="formRef"
      :model="state.form"
      layout="inline"
      autocomplete="off"
      class="mb-15"
      @finish="onFinish"
    >
      <div class="flex">
        <a-form-item
          name="field"
          style="margin-right: 0"
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
        </a-form-item>

        <a-form-item name="keyword">
          <a-input
            v-model:value="state.form.keyword"
            placeholder="请输入关键词"
            style="width: 200px"
          />
        </a-form-item>

        <a-form-item
          label="是否星标"
          name="like"
        >
          <a-switch
            v-model:checked="state.form.like"
            un-checked-value="0"
            checked-value="1"
          />
        </a-form-item>
      </div>

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

    <!-- 搜索结果表格 -->
    <a-table
      :pagination="false"
      :bordered="true"
      :columns="state.columns"
      :data-source="state.dataSource"
    >
      <template #title>
        <div class="flex justify-end">
          <a-button
            type="primary"
            @click="state.showAddModal = true"
          >
            新增词组
          </a-button>
        </div>
      </template>

      <template #bodyCell="{ column, text, record }">
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

        <template v-if="column.dataIndex === 'action'">
          <DeleteOutlined
            class="icon-text text-red mr-10"
            @click="onDelete(record.docId)"
          />
          <StarFilled
            v-show="record.like === '1'"
            class="icon-text text-blue"
            @click="onLike(record, '0')"
          />
          <StarOutlined
            v-show="record.like === '0'"
            class="icon-text text-blue"
            @click="onLike(record, '1')"
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

.icon-text {
  font-size: 18px;
}
</style>
