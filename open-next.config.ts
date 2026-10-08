// OpenNext for Cloudflare 的配置。这个项目没有 ISR / 增量缓存，也没有 R2 桶，
// 所以用默认配置就够了（on-demand revalidation、tag cache 都不需要）。
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
