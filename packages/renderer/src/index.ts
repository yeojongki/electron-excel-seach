import {createApp} from 'vue';
import App from '/@/App.vue';

window.process = window.process || {};
window.global = window;

createApp(App).mount('#app');
