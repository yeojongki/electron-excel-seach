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
#app {
  text-align: center;
  margin: 20px;
}
.mt-15 {
  margin-top: 15px;
}
.mr-15 {
  margin-right: 15px;
}
.mb-15 {
  margin-bottom: 15px;
}
.ml-15 {
  margin-left: 15px;
}
</style>
