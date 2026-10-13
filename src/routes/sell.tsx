import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [{ title: "Best Market Finder — KisanSaathi" }],
  }),
  component: SellRedirect,
});

function SellRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/best-market", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center text-sm font-semibold text-muted-foreground">
      Redirecting to Best Market Finder...
    </div>
  );
}
