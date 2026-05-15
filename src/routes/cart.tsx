import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Корзина — ГРОСС Запчасти" }] }),
  component: () => (
    <div className="mx-auto max-w-[1400px] px-4 py-20 text-center space-y-4">
      <h1 className="font-display text-4xl">Корзина</h1>
      <p className="text-muted-foreground">Страница в разработке.</p>
      <Link to="/" className="text-brand hover:underline">← На главную</Link>
    </div>
  ),
});
