<script lang="ts" setup>
import { ref } from 'vue';
import SheetImport from './components/SheetImport.vue';
import SheetSearch from './components/SheetSearch.vue';
import ImportHistory from './components/ImportHistory.vue';

const activeKey = ref('import');
</script>

<template>
  <div>
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane
        key="search"
        tab="词库搜索"
      >
        <SheetSearch />
      </a-tab-pane>

      <a-tab-pane
        key="import"
        tab="词库导入"
      >
        <SheetImport />
      </a-tab-pane>

      <a-tab-pane
        key="importHistory"
        tab="导入历史"
      >
        <ImportHistory />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style scoped>
:deep(.ant-tabs) {
  overflow: visible;
}
</style>
