import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Beaker,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Leaf,
  Microscope,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import { Page } from "@/components/AppShell";
import { LANTANA_RESEARCH_STUDIES } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/lantana-guard")({
  head: () => ({
    meta: [
      { title: "Lantana Eco-Guard — Research-Pilot Module | KisanSaathi" },
      {
        name: "description",
        content:
          "Evidence-based educational module on Lantana camara biomass, verified scientific bioassays from NCBI PMC, unvalidated research hypotheses and standard grain hygiene practices.",
      },
    ],
  }),
  component: LantanaEcoGuardPage,
});

function LantanaEcoGuardPage() {
  const { s, t } = useSettings();

  return (
    <Page>
      <div className="space-y-8">
        {/* Module Header with Visual Distinction */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-card p-6 sm:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/15 border border-amber-600/30 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              <Microscope className="size-3.5" />
              <span>Independent Educational & Research-Pilot Module</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Lantana Eco-Guard
            </h1>
            <p className="font-display text-base sm:text-lg font-bold text-amber-900 dark:text-amber-300">
              Learn • Research • Protect Stored Produce
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Educating agricultural stakeholders about the invasive weed <em>Lantana camara</em>,
              ecological management, peer-reviewed laboratory research on botanical volatiles, and
              essential standard grain storage hygiene.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-lg bg-card border px-2.5 py-1">
                Farmers & Produce Sellers
              </span>
              <span className="rounded-lg bg-card border px-2.5 py-1">
                Grain Warehouses & Godowns
              </span>
              <span className="rounded-lg bg-card border px-2.5 py-1">Rural Households</span>
              <span className="rounded-lg bg-card border px-2.5 py-1">
                Livestock & Poultry Owners
              </span>
            </div>
          </div>
        </div>

        {/* PROMINENT MANDATORY SAFETY WARNING BANNER */}
        <section
          role="alert"
          className="rounded-3xl border-2 border-destructive bg-destructive/10 p-5 sm:p-6 text-destructive shadow-sm space-y-2"
        >
          <div className="flex items-center gap-2.5 font-black text-sm uppercase tracking-wide">
            <ShieldAlert className="size-6 shrink-0" />
            <span>MANDATORY CONSUMER & FOOD SAFETY WARNING</span>
          </div>

          <p className="font-bold text-sm sm:text-base leading-snug">
            "Experimental Lantana preparations have not been established as safe or effective for
            food-storage use. Do not place experimental preparations in or near food, stored grain,
            animal feed, or areas accessible to children, livestock or pets."
          </p>

          <p className="text-xs text-destructive/90 leading-relaxed pt-1 border-t border-destructive/20">
            <em>Lantana camara</em> foliage contains toxic pentacyclic triterpenoids (including
            lantadene A and lantadene B) known to cause hepatotoxicity, jaundice, and
            photosensitization in ruminants and livestock. Direct contact with food grain meant for
            human or animal consumption is strictly contraindicated.
          </p>
        </section>

        {/* SECTION A: PLANT INFORMATION & INVASIVE WEED CONTEXT */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Leaf className="size-5 text-amber-600" />
            <h2 className="font-display text-xl font-bold text-foreground">
              A. Botanical Profile & Invasive Plant Context
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <h3 className="font-bold text-sm text-foreground">
                Identification: <em>Lantana camara Linn.</em> (Verbenaceae)
              </h3>
              <p>
                <em>Lantana camara</em> is an erect, heavily branched, perennial evergreen shrub
                originating in tropical America. It is characterized by rough, ovate serrated leaves
                that emit a pungent aromatic odor when crushed, four-angled stems with recurved
                prickles, and compact flower clusters ranging from yellow and orange to pink and
                red.
              </p>
              <p>
                <strong>Ecological Impact:</strong> Listed by the International Union for
                Conservation of Nature (IUCN) as one of the world's 100 most aggressive invasive
                alien species. It displaces native Indian biodiversity, suppresses natural
                regeneration of forest trees, disrupts wildlife grazing corridors, and overtakes
                agricultural pastures.
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-600" />
                Responsible Physical Removal & Safe Handling
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Personal Protection:</strong> Always wear thick gloves, eye protection,
                  and full-sleeved canvas clothing to prevent skin rashes and abrasions from stem
                  prickles.
                </li>
                <li>
                  <strong>Root Extraction:</strong> Mechanical uprooting must remove the root crown
                  to prevent vigorous coppicing and regrowth during monsoon rains.
                </li>
                <li>
                  <strong>Disposal:</strong> Dry removed biomass away from livestock grazing
                  corridors. Do not burn uncontrolled heaps in dry forests due to intense volatile
                  resin fire hazards.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION B: PEER-REVIEWED SCIENTIFIC EVIDENCE (PMC4571242 & PMC10819012) */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Beaker className="size-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">
              B. Published Peer-Reviewed Research Evidence
            </h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            The following summaries detail published scientific investigations from the National
            Center for Biotechnology Information (NCBI PMC). As required by scientific integrity,
            findings are reported exactly as published without fabrication or extrapolation.
          </p>

          <div className="space-y-4">
            {LANTANA_RESEARCH_STUDIES.map((study, idx) => (
              <div
                key={study.pmcId}
                className="rounded-2xl border bg-muted/20 p-5 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-[11px] text-primary block">
                      Study #{idx + 1} · {study.journal} ({study.year})
                    </span>
                    <h3 className="font-bold text-sm text-foreground mt-0.5">{study.citation}</h3>
                  </div>

                  <a
                    href={`https://pmc.ncbi.nlm.nih.gov/articles/${study.pmcId}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-muted shrink-0"
                  >
                    <span>View on NCBI PMC ({study.pmcId})</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                  <div>
                    <strong className="text-foreground block mb-0.5">Tested Insect Pests:</strong>
                    <ul className="list-disc list-inside space-y-0.5">
                      {study.testedPests.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground block mb-0.5">Investigation Type:</strong>
                    <span>{study.studyType}</span>
                    <strong className="text-foreground block mt-2 mb-0.5">
                      Regulatory Status:
                    </strong>
                    <span className="text-amber-800 dark:text-amber-300 font-semibold">
                      {study.regulatoryStatus}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-card border p-3 space-y-1">
                  <strong className="text-foreground block font-bold">
                    Key Verified Laboratory Findings:
                  </strong>
                  <p className="text-muted-foreground leading-relaxed">
                    {study.keyVerifiedFindings}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 space-y-1">
                  <strong className="text-amber-900 dark:text-amber-200 block font-bold flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Crucial Limitations & Boundaries of Evidence:
                  </strong>
                  <p className="text-amber-950/80 dark:text-amber-300/80 leading-relaxed">
                    {study.crucialLimitations}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION C: RESEARCH HYPOTHESIS VS REALITY */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Layers className="size-5 text-amber-600" />
            <h2 className="font-display text-xl font-bold text-foreground">
              C. Research Hypothesis Status (Not a Proven Product)
            </h2>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Proposals in informal circles suggesting that compressed tablets, dried leaf sachets,
              or bio-composite sheets made from <em>Lantana camara</em> biomass can serve as
              household grain protectants are an <strong>unvalidated research hypothesis</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-1.5">
                <h4 className="font-bold text-destructive flex items-center gap-1.5 text-xs">
                  <X className="size-4" />
                  What Science Does NOT Support:
                </h4>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>No evidence that lantana repels rodents (rats or mice).</li>
                  <li>No evidence of safe, unsealed open warehouse efficacy.</li>
                  <li>Not food-grade or approved for direct contact with grain.</li>
                  <li>
                    Home extraction with toxic chemicals or domestic fumigation is dangerous and
                    prohibited.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-1.5">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Check className="size-4" />
                  What Science Actually Observes:
                </h4>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Essential oil contains volatile sesquiterpenes (caryophyllene).</li>
                  <li>
                    Exhibits in-vitro contact/fumigant mortality in small sealed lab jars against
                    specific beetles.
                  </li>
                  <li>Requires controlled chemical isolation not replicable in farm homes.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION D: RESPONSIBLE RESEARCH WORKFLOW */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <FileCheck2 className="size-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">
              D. Responsible 9-Stage Scientific Research Pipeline
            </h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Before any botanical biomass derivative can ever be considered for practical
            agricultural pest management, rigorous multidisciplinary research under institutional
            oversight is mandatory:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              {
                num: "01",
                title: "Botanical Taxon Authentication",
                desc: "Rigorous species verification and authenticated voucher specimen deposition.",
              },
              {
                num: "02",
                title: "Safe Sample Harvesting",
                desc: "Documented seasonal collection adhering to ecological weed management protocols.",
              },
              {
                num: "03",
                title: "Supervised Extraction",
                desc: "Standardized laboratory extraction under qualified chemical laboratory oversight.",
              },
              {
                num: "04",
                title: "Active Volatile Profiling",
                desc: "GC-MS / HPLC characterization and quantification of active volatile terpenes.",
              },
              {
                num: "05",
                title: "Bioassay Target Testing",
                desc: "Multi-stage mortality, knockdown, and progeny suppression efficacy testing.",
              },
              {
                num: "06",
                title: "Toxicology Assessment",
                desc: "Mammalian toxicity, dermal irritation, and inhalation safety evaluations in vivo.",
              },
              {
                num: "07",
                title: "Environmental Lifecycle",
                desc: "Soil residue breakdown, non-target beneficial insect, and pollinator safety.",
              },
              {
                num: "08",
                title: "Food Contact Evaluation",
                desc: "Grain residue absorption testing, taste tainting, and cooking safety assays.",
              },
              {
                num: "09",
                title: "Regulatory Approval",
                desc: "Independent multi-location peer trials and Central Insecticides Board (CIB) registration.",
              },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border bg-muted/20 p-3.5 space-y-1">
                <span className="font-mono text-xs font-black text-primary block">
                  Stage {step.num}
                </span>
                <h4 className="font-bold text-foreground">{step.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION E: ESTABLISHED SAFER STORAGE PRACTICES */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="size-5 text-emerald-600" />
            <h2 className="font-display text-xl font-bold text-foreground">
              E. Standard Verified Safe Grain Storage Practices
            </h2>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Instead of experimental unvalidated substances, farmers and warehouse managers should
            implement proven scientific post-harvest hygiene practices:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/20 p-3.5">
              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-bold">
                  1. Grain Sun-Drying (&lt;12% Moisture)
                </strong>
                <span className="text-muted-foreground">
                  Thoroughly dry grains before bagging. Storage pests cannot complete life cycles
                  when grain moisture remains below 10–12%.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/20 p-3.5">
              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-bold">
                  2. Godown Hygiene & Spillage Cleanup
                </strong>
                <span className="text-muted-foreground">
                  Sweep and remove all leftover grain dust, broken kernels, and old gunny sacks
                  before storing new seasonal harvest.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/20 p-3.5">
              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-bold">
                  3. Multi-Layer Hermetic Storage Bags
                </strong>
                <span className="text-muted-foreground">
                  Use verified air-tight hermetic liners (such as Purdue Improved Crop Storage bags)
                  that deplete oxygen and kill insect eggs naturally.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border bg-muted/20 p-3.5">
              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-bold">
                  4. Physical Rodent Proofing
                </strong>
                <span className="text-muted-foreground">
                  Store bags on wooden dunnage crates 1 foot above floor and 2 feet away from walls.
                  Fit godown doors with metal kick-plates.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION F: TRAINING AND EXPERT SUPPORT */}
        <section className="rounded-3xl border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <GraduationCap className="size-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">
              F. Training & Qualified Extension Support
            </h2>
          </div>

          <div className="rounded-2xl border border-dashed p-6 text-center space-y-1.5 text-xs text-muted-foreground">
            <p className="font-bold text-foreground text-sm">No sessions available yet.</p>
            <p>
              Certified extension sessions on botanical volatile bio-prospecting and safe storage
              are scheduled via state Agricultural Universities and KVK centers.
            </p>
          </div>
        </section>
      </div>
    </Page>
  );
}
