import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/sow")({
  head: () => ({
    meta: [{ title: "Price Trends & Crop Planning — KisanSaathi" }],
  }),
  component: SowRedirect,
});

function SowRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/trends", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center text-sm font-semibold text-muted-foreground">
      Redirecting to Price Trends & Planning...
    </div>
  );
}
