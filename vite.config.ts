// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Pin the generated wrangler.json's Worker name and give it an (empty)
  // `previews` block, directly through Nitro's own config — rather than
  // relying on Nitro finding a root wrangler.jsonc file, which it was not
  // doing on Cloudflare Workers Builds' runner (it kept auto-generating
  // "<owner>-<repo>" there even with that file present). This path is
  // merged in unconditionally by @lovable.dev/vite-tanstack-config, so it
  // works the same locally and in CI.
  nitro: {
    cloudflare: {
      wrangler: {
        name: "smart-shop-ui",
        previews: {},
      },
    },
  },
} as any);
