import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCircle2,
  Globe,
  Languages,
  Lock,
  MapPin,
  Moon,
  RefreshCw,
  Save,
  Shield,
  Sprout,
  Sun,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/AppShell";
import { LocationSelector } from "@/components/LocationSelector";
import { CROPS } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Farmer Profile & Settings | KisanSaathi" },
      {
        name: "description",
        content:
          "Manage your farmer profile, preferred language, regional mandi location, transport freight rates and privacy settings.",
      },
    ],
  }),
  component: FarmerProfilePage,
});

function FarmerProfilePage() {
  const { s, set, t } = useSettings();
  const [name, setName] = useState(s.farmerName || "Kisan Bandhu");
  const [phone, setPhone] = useState(s.farmerPhone || "");
  const [rate, setRate] = useState(s.rate || 1.8);
  const [vehicleRate, setVehicleRate] = useState(s.vehicleRate || 1.2);
  const [myVehicle, setMyVehicle] = useState(s.myVehicle || false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    set({
      farmerName: name.trim(),
      farmerPhone: phone.trim(),
      rate: Number(rate) || 1.8,
      vehicleRate: Number(vehicleRate) || 1.2,
      myVehicle,
    });

    setSaveMsg(t.profileSaved);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleResetData = () => {
    if (confirm(t.resetConfirm)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Page>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            <User className="size-6 text-primary" />
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {t.profile || "Farmer Profile and Settings"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.profileIntro}
          </p>
        </div>

        {saveMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{saveMsg}</span>
          </div>
        )}

        {/* Profile Details Form */}
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl border bg-card p-5 sm:p-6 shadow-2xs space-y-5"
        >
          <h2 className="font-display text-base font-bold text-foreground">
            {t.personalInfo}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.farmerNameLabel}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 font-semibold text-foreground"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="h-10 w-full rounded-xl border bg-background px-3 font-bold text-foreground"
              />
            </div>
          </div>

          {/* Location Setting Card */}
          <div className="rounded-2xl bg-muted/30 p-4 border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {t.selectedFarmLocation}
              </span>
              <button
                type="button"
                onClick={() => setShowLocPicker(!showLocPicker)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {showLocPicker ? t.closePicker : t.changeLocationShort}
              </button>
            </div>

            <p className="text-muted-foreground">
              {s.loc
                ? `${s.loc.village || s.loc.district}, ${s.loc.district}, ${s.loc.state}`
                : t.noLocationSet}
            </p>

            {showLocPicker && (
              <div className="pt-2">
                <LocationSelector
                  value={s.loc}
                  onChange={(loc) => {
                    set({ loc });
                    setShowLocPicker(false);
                  }}
                  onClose={() => setShowLocPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Transport Rate Preferences */}
          <div className="space-y-3 pt-2 border-t text-xs">
            <h3 className="font-bold text-foreground flex items-center gap-1.5">
              <Truck className="size-4 text-primary" />
              {t.transportFreight}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {t.commercialRate}
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 1.8)}
                  className="h-10 w-full rounded-xl border bg-background px-3 font-bold text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  {t.ownVehicleRate}
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={vehicleRate}
                  onChange={(e) => setVehicleRate(Number(e.target.value) || 1.2)}
                  className="h-10 w-full rounded-xl border bg-background px-3 font-bold text-foreground"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={myVehicle}
                onChange={(e) => setMyVehicle(e.target.checked)}
                className="size-4 rounded text-primary"
              />
              <span>{t.ownVehiclePrimary}</span>
            </label>
          </div>

          <button
            type="submit"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Save className="size-4" />
            <span>{t.saveProfileSettings || "Save Profile Settings"}</span>
          </button>
        </form>

        {/* Language Selection Grid */}
        <section className="rounded-3xl border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">
              {t.appLanguage}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {LANGS.map((lang) => {
              const isSelected = s.lang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => set({ lang: lang.code })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="font-display text-base font-bold text-foreground leading-tight">
                    {lang.native}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{lang.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Theme & Display Mode */}
        <section className="rounded-3xl border bg-card p-5 shadow-2xs space-y-3 text-xs">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Sun className="size-4 text-primary" />
            {t.appearanceTheme}
          </h2>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set({ theme: "light" })}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold ${
                s.theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Sun className="size-4" />
              <span>{t.lightMode || "Light Mode"}</span>
            </button>

            <button
              type="button"
              onClick={() => set({ theme: "dark" })}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold ${
                s.theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Moon className="size-4" />
              <span>{t.darkMode || "Dark Mode"}</span>
            </button>
          </div>
        </section>

        {/* Data & Privacy Reset */}
        <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 shadow-2xs space-y-3 text-xs">
          <h2 className="font-bold text-destructive flex items-center gap-1.5">
            <Shield className="size-4" />
            {t.localDataPrivacy}
          </h2>
          <p className="text-muted-foreground">
            {t.localDataDescription}
          </p>
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 rounded-xl border border-destructive/50 bg-card px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>{t.resetLocalPrefs}</span>
          </button>
        </section>
      </div>
    </Page>
  );
}
