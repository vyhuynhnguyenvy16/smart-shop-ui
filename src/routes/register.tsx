import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký — Northline" },
      { name: "description", content: "Tạo tài khoản Northline để mua sắm nhanh hơn." },
      { property: "og:title", content: "Đăng ký — Northline" },
      { property: "og:description", content: "Tạo tài khoản Northline trong một phút." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthForm mode="register" />,
});
