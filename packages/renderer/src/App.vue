<script lang="ts" setup>
import { ref } from 'vue';
import SheetImport from './components/SheetImport.vue';
import SheetSearch from './components/SheetSearch.vue';

const activeKey = ref('import');
</script>

<template>
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
  </a-tabs>
</template>

<style>
@import './styles/global.css';

#app {
  text-align: center;
  margin: 20px;
}
</style>
