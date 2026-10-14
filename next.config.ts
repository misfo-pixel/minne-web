import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // 导入菜单要上传照片（浏览器里压过，一张三四百 KB，最多 4 张）。Vercel 单次请求上限 4.5MB
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
