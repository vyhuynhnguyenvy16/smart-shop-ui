import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage, loginUser, registerUser } from "@/lib/api-client";

const inputClass =
  "h-12 w-full rounded-md border border-input bg-card px-3.5 text-base outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]";

export function AuthForm({ mode, redirect }: { mode: "login" | "register"; redirect?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const locked = attempts >= 5;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked || submitting) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMessage("Email không hợp lệ.");
    if (mode === "register" && !fullName.trim()) return setMessage("Vui lòng nhập họ tên.");
    if (password.length < 8) return setMessage("Mật khẩu tối thiểu 8 ký tự.");
    if (mode === "register" && password !== confirm)
      return setMessage("Mật khẩu xác nhận không khớp.");

    setSubmitting(true);
    setMessage("");
    try {
      if (mode === "register") {
        await registerUser({
          email: email.trim(),
          fullName: fullName.trim(),
          password,
          phone: phone.trim(),
        });
        setMessage("Tạo tài khoản thành công. Kiểm tra email rồi đăng nhập.");
        setTimeout(() => void navigate({ to: "/login", search: { redirect: undefined } }), 1200);
        return;
      }
      await loginUser({ email: email.trim(), password });
      setAttempts(0);
      if (redirect && redirect.startsWith("/")) window.location.assign(redirect);
      else await navigate({ to: "/" });
    } catch (reason) {
      const next = attempts + 1;
      setAttempts(next);
      setMessage(
        next >= 5
          ? "Bạn đã nhập sai quá nhiều lần. Tài khoản tạm khóa, thử lại sau 15 phút."
          : `${getApiErrorMessage(reason, "Đăng nhập thất bại.")} Còn ${5 - next} lần thử.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-shop section-y pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-md hairline bg-card p-6 sm:p-8">
        <h1 className="text-h1 text-foreground">
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Theo dõi đơn hàng và lưu địa chỉ giao hàng."
            : "Chỉ mất chưa đến một phút."}
        </p>

        {message && (
          <div
            role="alert"
            className="mt-6 flex gap-3 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          {mode === "register" && (
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-semibold">
                Họ tên
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
            />
          </div>
          {mode === "register" && (
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>
          {mode === "register" && (
            <div>
              <label htmlFor="confirm" className="mb-1 block text-sm font-semibold">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          )}

          <Button type="submit" variant="primary" size="md" disabled={locked || submitting}>
            <Lock /> {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
          {mode === "login" ? (
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Tạo tài khoản mới
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="font-semibold text-primary hover:underline"
            >
              Tôi đã có tài khoản
            </Link>
          )}
          <Link
            to="/products"
            search={{}}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
