import { createFileRoute, redirect } from "@tanstack/react-router";
import { chapters } from "@/demo/chapters";

export const Route = createFileRoute("/demo/")({
  beforeLoad: () => {
    throw redirect({ to: "/demo/$chapter", params: { chapter: chapters[0].slug } });
  },
});
