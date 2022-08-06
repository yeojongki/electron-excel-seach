<script setup lang="ts">
import { message, Modal, notification } from 'ant-design-vue';
import { onActivated, ref } from 'vue';
import { deleteImportHistory, getImportHistory } from '../utils/storage';
import { indexDB } from '../db';

const colors = ['pink', 'red', 'orange', 'green', 'cyan', 'blue', 'purple'];
const history = ref(getImportHistory());

const updateHistory = () => {
  history.value = getImportHistory();
};

// 切换到当前 tab 刷新历史
onActivated(updateHistory);

const getColor = (tableName: string, book: string | number) => {
  return colors[(tableName.length + String(book).length) % 7];
};

const onDeleteTag = (tableName: string, book: string | number) => {
  const name = `${book}-${tableName}`;
  Modal.confirm({
    title: `确定删除工作表【${name}】?`,
    async onOk() {
      try {
        const result = await indexDB.buckets({
          FIELD: 'table',
          VALUE: tableName,
        });
        const ids = result[0]._id;
        await indexDB.delete(ids);
        message.success(`已删除${name}`);

        deleteImportHistory(book + '', [tableName]);
        updateHistory();
      } catch (error) {
        notification.error({
          message: (error as any)?.message || JSON.stringify(error),
        });
      }
    },
  });
};

const onDeleteBook = (book: string) => {
  Modal.confirm({
    title: `确定删除工作簿【${book}】?`,
    async onOk() {
      try {
        const result = await indexDB.buckets({
          FIELD: 'book',
          VALUE: book,
        });
        const ids = result[0]._id;
        await indexDB.delete(ids);
        message.success(`已删除${name}`);

        deleteImportHistory(book + '');
        updateHistory();
      } catch (error) {
        notification.error({
          message: (error as any)?.message || JSON.stringify(error),
        });
      }
    },
  });
};
</script>

<template>
  <template v-if="history.length">
    <div
      v-for="(table, book) in history"
      :key="book + '-history'"
    >
      <div>
        <div class="mb-15">
          {{ book }}:
          <a-button
            size="small"
            danger
            @click="onDeleteBook(book + '')"
          >
            删除工作簿
          </a-button>
        </div>

        <a-tag
          v-for="tableName in table"
          :key="`${book}-${tableName}-tag`"
          closable
          :color="getColor(tableName, book)"
          class="mb-15"
          @close.prevent="onDeleteTag(tableName, book)"
        >
          {{ tableName }}
        </a-tag>
      </div>
      <a-divider />
    </div>
  </template>

  <a-empty v-else />
</template>
