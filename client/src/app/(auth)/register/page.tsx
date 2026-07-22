"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, user, checkAuth, clearError } =
    useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) router.replace("/chat");
  }, [user, router]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (username.length < 3)
      errors.username = "Username must be at least 3 characters";
    if (username.length > 20)
      errors.username = "Username must be 20 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      errors.username = "Username can only contain letters, numbers, and underscores";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await register(username, password);
      router.push("/chat");
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-mesh px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-glow-violet/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-glow-cyan/8 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-glow-violet to-glow-cyan shadow-glow">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Create account</h1>
          <p className="mt-1 text-sm text-surface-400">
            Join DevChat and start collaborating
          </p>
        </div>

        {/* Form card */}
        <div className="glass-strong rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFormErrors((prev) => ({ ...prev, username: "" }));
              }}
              error={formErrors.username}
              icon={<User className="h-4 w-4" />}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={formErrors.password}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              error={formErrors.confirmPassword}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-surface-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-400 transition-colors hover:text-accent-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
