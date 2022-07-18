declare module '*.vue' {
  import SI from 'search-index';
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export type SearchIndex = Awaited<ReturnType<typeof SI>>;
  export default component;
}

// export type typeSearchIndex = Awaited<ReturnType<typeof SI>>;
declare interface Window {
  SearchIndex: any;
}
