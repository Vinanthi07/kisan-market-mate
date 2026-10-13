import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FileQuestion,
  FileText,
  HelpCircle,
  Info,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  Sprout,
  Users,
  Wifi,
} from "lucide-react";
import { Page } from "@/components/AppShell";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Help, About & Data Sources | KisanSaathi" },
      {
        name: "description",
        content:
          "Mission, official agricultural data sources (Agmarknet / data.gov.in), calculation methodology, and privacy disclosures.",
      },
    ],
  }),
  component: HelpAboutPage,
});

function HelpAboutPage() {
  const { t } = useSettings();

  return (
    <Page>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-6 text-primary" />
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {t.about || "Help, About and Data Sources"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.helpSources}
          </p>
        </div>

        {/* Mission Card */}
        <section className="rounded-3xl border bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-foreground">KisanSaathi</h2>
              <p className="text-xs font-bold text-primary">
                {t.tagline}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.heroDescription}
          </p>
        </section>

        {/* Official Data Sources Disclosure */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Database className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">
              {t.dataTransparency}
            </h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              {t.dataIntegrationNote}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-2xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">Agmarknet (DMI)</h3>
                  <a
                    href="https://agmarknet.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>agmarknet.gov.in</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <p>
                  <strong>Entity:</strong> Directorate of Marketing & Inspection (DMI), Department
                  of Agriculture & Farmers Welfare, Ministry of Agriculture.
                </p>
                <p>
                  <strong>Coverage:</strong> Daily arrival quantities, minimum, maximum and modal
                  prices across registered APMC regulated markets nationwide.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">Open Government Data (OGD)</h3>
                  <a
                    href="https://data.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>data.gov.in</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <p>
                  <strong>Platform:</strong> National Informatics Centre (NIC), Ministry of
                  Electronics and Information Technology.
                </p>
                <p>
                  <strong>API Catalog:</strong> "Current Daily Price of Various Commodities from
                  Various Markets (Mandis)".
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 p-3.5 space-y-1 text-amber-950 dark:text-amber-200">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400" />
                {t.dataTransparency}
              </span>
              <p>
                {t.demoNotice}
              </p>
            </div>
          </div>
        </section>

        {/* Mathematical Formulas & Methodology */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Scale className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">
              {t.disclaimer}
            </h2>
          </div>

          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="rounded-2xl bg-muted/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-foreground">
                1. {t.netProceeds}
              </h3>
              <div className="rounded-xl bg-card border p-3 font-mono font-bold text-foreground text-center text-xs sm:text-sm">
                Net Proceeds = (Price × Quantity) − Transport − Mandi Fees − Loading − Packaging −
                Spoilage
              </div>
              <p>
                Candidate markets are ranked strictly by estimated net return. Gross prices alone
                frequently mislead farmers because transit fuel, APMC statutory fees (1.0% to 2.0%),
                and handling expenses can exceed inter-mandi price spreads.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-foreground">
                2. Weight & Commodity Conversion Standards
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>1 Quintal (q)</strong> = 100 Kilograms (kg)
                </li>
                <li>
                  <strong>1 Metric Tonne (MT)</strong> = 1,000 Kilograms = 10 Quintals
                </li>
                <li>
                  <strong>Price conversion:</strong> ₹30 / kg = ₹3,000 / quintal = ₹30,000 / tonne
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security, Privacy & PWA Support */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Shield className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">
              {t.localDataPrivacy}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-muted-foreground leading-relaxed">
            <div className="rounded-2xl border bg-muted/20 p-4 space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="size-4 text-primary" />
                {t.localDataPrivacy}
              </h4>
              <p>
                {t.localDataDescription}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4 space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Wifi className="size-4 text-primary" />
                {t.offline}
              </h4>
              <p>
                {t.offline}
              </p>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}
