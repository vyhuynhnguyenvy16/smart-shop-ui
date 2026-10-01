import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Tài khoản — Northline" },
      { name: "description", content: "Truy cập tài khoản Northline để quản lý đơn hàng." },
      { property: "og:title", content: "Tài khoản — Northline" },
      { property: "og:description", content: "Đăng nhập để quản lý đơn hàng Northline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { redirect: undefined } });
  },
  component: () => null,
});
