import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Đăng nhập — Northline" },
      { name: "description", content: "Đăng nhập Northline để theo dõi đơn hàng và địa chỉ." },
      { property: "og:title", content: "Đăng nhập — Northline" },
      { property: "og:description", content: "Đăng nhập tài khoản Northline của bạn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthForm mode="login" {...(redirect ? { redirect } : {})} />;
}
