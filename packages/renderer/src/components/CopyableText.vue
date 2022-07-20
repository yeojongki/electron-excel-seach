<script setup lang="ts">
import { CopyOutlined } from '@ant-design/icons-vue';
import { copyText } from '#preload';
import { message } from 'ant-design-vue';

const props = defineProps<{ text: string }>();

const onClick = (data: string) => {
  copyText(data);
  message.success('已复制');
};
</script>

<template>
  <span class="copyable-text">
    {{ props.text }}
    <CopyOutlined
      class="ml-15 text-blue"
      @click="onClick(props.text)"
    />
  </span>
</template>
