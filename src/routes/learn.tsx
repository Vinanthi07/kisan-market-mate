import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [{ title: "Farmer Training & Workshops — KisanSaathi" }],
  }),
  component: LearnRedirect,
});

function LearnRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/workshops", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center text-sm font-semibold text-muted-foreground">
      Redirecting to Farmer Training & Workshops...
    </div>
  );
}
