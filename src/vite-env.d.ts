/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 地址，Vercel 部署时设置为后端穿透地址 */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
