import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BottomNav } from "../components/BottomNav";
import { fallbackImageFor } from "../lib/products";
import { Toaster } from "sonner";
import { jsonLd, SITE_NAME, SITE_URL } from "../lib/seo";
import { buttonVariants } from "../components/ui/button";

function NotFoundComponent() {
  return (
    <div className="container-shop flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <p className="tabular text-body-sm font-medium text-primary">Lỗi 404</p>
        <h1 className="mt-2 text-h1 text-foreground">Không tìm thấy trang</h1>
        <p className="mt-3 text-body-lg text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã được chuyển đi. Thử xem toàn bộ sản phẩm nhé.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/products"
            search={{}}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Xem sản phẩm
          </Link>
          <Link to="/" className={buttonVariants({ variant: "secondary", size: "md" })}>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-h2 text-foreground">Trang chưa tải được</h1>
        <p className="mt-2 text-body-lg text-muted-foreground">
          Đã có lỗi khi kết nối tới máy chủ. Bạn thử tải lại, hoặc quay về trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Thử lại
          </button>
          <a href="/" className={buttonVariants({ variant: "secondary", size: "md" })}>
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#fafaf7" },
      { title: "Northline — Thời trang tối giản, bền lâu" },
      {
        name: "description",
        content: "Northline: quần áo, áo khoác, giày, túi và phụ kiện tối giản, mặc được lâu.",
      },
      { name: "author", content: "Northline" },
      { property: "og:site_name", content: "Northline" },
      { property: "og:locale", content: "vi_VN" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      // The two weights used above the fold; the rest load on demand.
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-latin-400-normal.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-latin-600-normal.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      }),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Ảnh từ backend bị lỗi (404) → tự đổi sang ảnh dự phòng theo danh mục.
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset["fallbackUsed"]) return;
      img.dataset["fallbackUsed"] = "1";
      img.src = img.dataset["fallback"] || fallbackImageFor(undefined);
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-foreground focus:px-4 focus:py-3 focus:text-sm focus:text-background"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="min-h-[60vh] outline-none">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <Toaster position="top-center" richColors closeButton duration={4000} />
    </QueryClientProvider>
  );
}
