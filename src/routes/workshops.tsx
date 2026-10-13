import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Shield,
  ShieldAlert,
  Ticket,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { DEMO_WORKSHOPS, type WorkshopSession } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Farmer Training & Extension Workshops | KisanSaathi" },
      {
        name: "description",
        content:
          "Practical agricultural workshops on APMC price tracking, cost accounting, vermicomposting, and safe post-harvest grain storage.",
      },
    ],
  }),
  component: FarmerWorkshopsPage,
});

interface RegistrationRecord {
  id: string;
  workshopId: string;
  workshopTitle: string;
  attendeeName: string;
  attendeePhone: string;
  village: string;
  numAttendees: number;
  registeredAt: string;
}

const REGISTRATIONS_KEY = "kisansaathi.workshop_registrations";

function FarmerWorkshopsPage() {
  const { s, t } = useSettings();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopSession | null>(null);

  // Registration Form
  const [attendeeName, setAttendeeName] = useState(s.farmerName || "");
  const [attendeePhone, setAttendeePhone] = useState(s.farmerPhone || "");
  const [villageName, setVillageName] = useState(s.loc?.village || "");
  const [numSeats, setNumSeats] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState<RegistrationRecord | null>(null);

  // Stored registrations
  const [myRegistrations, setMyRegistrations] = useState<RegistrationRecord[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REGISTRATIONS_KEY);
      if (stored) setMyRegistrations(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const filteredSessions = useMemo(() => {
    return DEMO_WORKSHOPS.filter((w) => {
      return filterCategory === "all" || w.category === filterCategory;
    });
  }, [filterCategory]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshop) return;
    setFormError(null);

    const cleanPhone = attendeePhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!attendeeName.trim()) {
      setFormError("Please enter the attendee name.");
      return;
    }

    const reg: RegistrationRecord = {
      id: "reg-" + Math.floor(100000 + Math.random() * 900000),
      workshopId: selectedWorkshop.id,
      workshopTitle: selectedWorkshop.title,
      attendeeName: attendeeName.trim(),
      attendeePhone: cleanPhone,
      village: villageName.trim() || "Local Panchayat",
      numAttendees: numSeats,
      registeredAt: new Date().toLocaleDateString("en-IN"),
    };

    const updated = [reg, ...myRegistrations];
    setMyRegistrations(updated);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(updated));

    setSuccessConfirmation(reg);
    setSelectedWorkshop(null);
  };

  return (
    <Page>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.workshops || "Farmer Training and Workshops"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agricultural extension training on price awareness, cost accounting, composting and
              safe storage.
            </p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Topics" },
            { id: "mandi_awareness", label: "Mandi Price Awareness" },
            { id: "organic_manure", label: "Compost & Bio-fertilizer" },
            { id: "post_harvest_storage", label: "Grain Storage & Hygiene" },
            { id: "cost_accounting", label: "Cost & Budgeting" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCategory(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 font-bold transition-colors ${
                filterCategory === c.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Success Modal / Banner */}
        {successConfirmation && (
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 sm:p-5 text-xs text-emerald-950 dark:text-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="size-5" />
                Registration Confirmed! Token #{successConfirmation.id}
              </span>
              <button
                type="button"
                onClick={() => setSuccessConfirmation(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p>
              Successfully booked {successConfirmation.numAttendees} seat(s) for{" "}
              <strong>{successConfirmation.workshopTitle}</strong> under name{" "}
              <strong>{successConfirmation.attendeeName}</strong> (
              {successConfirmation.attendeePhone}). Stored in your local profile.
            </p>
          </div>
        )}

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="rounded-3xl border bg-card p-10 text-center space-y-2">
            <GraduationCap className="size-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-foreground text-sm">No sessions available yet.</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No genuine training programs currently configured for this category. New sessions from
              Krishi Vigyan Kendra will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const isRegistered = myRegistrations.some((r) => r.workshopId === session.id);
              return (
                <div
                  key={session.id}
                  className="rounded-3xl border bg-card p-5 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary capitalize">
                        {session.category.replace("_", " ")}
                      </span>
                      <span className="rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                        DEMO
                      </span>
                    </div>

                    <h2 className="font-display text-base font-extrabold text-foreground leading-snug">
                      {session.title}
                    </h2>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {session.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t">
                      <p className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary shrink-0" />
                        <span>
                          <strong>Organizer:</strong> {session.organizer}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary shrink-0" />
                        <span>
                          {session.date} · {session.time}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        {session.mode === "online" ? (
                          <Video className="size-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <MapPin className="size-3.5 text-primary shrink-0" />
                        )}
                        <span className="truncate">{session.locationOrLink}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    {isRegistered ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 p-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        <Check className="size-4" />
                        <span>You are registered for this session</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedWorkshop(session)}
                        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                      >
                        <Ticket className="size-4" />
                        <span>Register Free</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Confirmed Registrations Section */}
        {myRegistrations.length > 0 && (
          <section className="rounded-3xl border bg-card p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Ticket className="size-4 text-primary" />
              My Saved Workshop Registrations ({myRegistrations.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {myRegistrations.map((r) => (
                <div key={r.id} className="rounded-2xl border bg-muted/20 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-foreground">{r.workshopTitle}</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">
                      #{r.id}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Attendee: {r.attendeeName} ({r.numAttendees} seat) · Village: {r.village}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Registration Modal */}
        {selectedWorkshop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Register for Workshop
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {selectedWorkshop.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkshop(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                {formError && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-destructive/10 p-2 text-destructive font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Farmer / Attendee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Mobile Phone (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Village / Taluk
                    </label>
                    <input
                      type="text"
                      value={villageName}
                      onChange={(e) => setVillageName(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Number of Attendees
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={numSeats}
                      onChange={(e) => setNumSeats(Number(e.target.value) || 1)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Check className="size-4" />
                  <span>Confirm Registration</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
