import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Recycle,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sprout,
  Truck,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/AppShell";
import { DEMO_FERTILIZERS, type FertilizerListing } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/fertilizer")({
  head: () => ({
    meta: [
      { title: "Organic Fertilizer & Manure Marketplace | KisanSaathi" },
      {
        name: "description",
        content:
          "Discover vermicompost, jeevamrutha and aged farmyard manure with transparent feedstock and batch date disclosures. Educational compost preparation guides.",
      },
    ],
  }),
  component: OrganicFertilizerPage,
});

const STORAGE_KEY = "kisansaathi.user_fertilizer_listings";

function OrganicFertilizerPage() {
  const { s, t } = useSettings();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [enquiryTarget, setEnquiryTarget] = useState<FertilizerListing | null>(null);
  const [enquirySuccessMsg, setEnquirySuccessMsg] = useState<string | null>(null);

  // Form State
  const [prodTitle, setProdTitle] = useState("");
  const [prodSeller, setProdSeller] = useState(s.farmerName || "Local Organic Producer");
  const [prodCategory, setProdCategory] = useState<FertilizerListing["category"]>("vermicompost");
  const [prodFeedstock, setProdFeedstock] = useState("Aged cattle dung + chopped crop residue");
  const [prodQty, setProdQty] = useState<number>(20);
  const [prodUnit, setProdUnit] = useState<FertilizerListing["unit"]>("quintal");
  const [prodPrice, setProdPrice] = useState<number>(600);
  const [prodLocation, setProdLocation] = useState(
    s.loc ? `${s.loc.district}, ${s.loc.state}` : "Karnataka",
  );
  const [prodBatchDate, setProdBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [prodPackaging, setProdPackaging] = useState("50 kg bags");
  const [prodDelivery, setProdDelivery] =
    useState<FertilizerListing["deliveryOption"]>("transporter_share");
  const [prodDesc, setProdDesc] = useState(
    "Well matured, dark brown friable texture, no weed seeds.",
  );

  // User Listings
  const [userListings, setUserListings] = useState<FertilizerListing[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserListings(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const combinedListings = useMemo(() => {
    return [...userListings, ...DEMO_FERTILIZERS];
  }, [userListings]);

  const filteredListings = useMemo(() => {
    return combinedListings.filter((item) => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.sellerName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.feedstockMethod.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [combinedListings, activeCategory, searchQuery]);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) return;

    const newListing: FertilizerListing = {
      id: "fert-" + Date.now(),
      title: prodTitle.trim(),
      sellerName: prodSeller.trim(),
      sellerType: "farmer",
      category: prodCategory,
      feedstockMethod: prodFeedstock.trim(),
      quantityAvailable: prodQty,
      unit: prodUnit,
      price: prodPrice,
      priceUnit: `₹ / ${prodUnit}`,
      location: prodLocation.trim(),
      batchDate: prodBatchDate,
      packaging: prodPackaging.trim(),
      deliveryOption: prodDelivery,
      description: prodDesc.trim(),
      isDemo: false,
    };

    const updated = [newListing, ...userListings];
    setUserListings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setIsCreateModalOpen(false);
    setProdTitle("");
  };

  const handleSendEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryTarget) return;
    setEnquirySuccessMsg(
      `Order enquiry sent to ${enquiryTarget.sellerName} for ${enquiryTarget.title}.`,
    );
    setEnquiryTarget(null);
    setTimeout(() => setEnquirySuccessMsg(null), 3000);
  };

  return (
    <Page>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="size-6 text-primary" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {t.fertilizer || "Organic Fertilizer & Manure Marketplace"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Source verified vermicompost, cow dung manure, jeevamrutha and bio-fertilizers
              directly from farmers and FPOs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>List Organic Manure</span>
          </button>
        </div>

        {/* Quality & Certification Disclosure Notice */}
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            <span>Product Quality & Certification Notice</span>
          </div>
          <p className="leading-relaxed">
            Listings display farmer-reported preparation methods and batch dates. KisanSaathi does
            not issue laboratory certifications or organic compliance stamps without authorized
            testing lab reports. Always test on small plots and inspect moisture, maturity and
            weed-seed presence before bulk application.
          </p>
        </div>

        {enquirySuccessMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{enquirySuccessMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vermicompost, jeevamrutha, FYM, seller, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-xs focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs w-full sm:w-auto">
              {[
                { id: "all", label: "All Products" },
                { id: "vermicompost", label: "Vermicompost" },
                { id: "farmyard_manure", label: "Pit Manure (FYM)" },
                { id: "jeevamrutha", label: "Jeevamrutha" },
                { id: "bio_fertilizer", label: "Bio-Fertilizer" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 font-bold transition-colors ${
                    activeCategory === c.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border bg-card p-5 shadow-2xs space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-extrabold text-foreground leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="size-3 text-primary" />
                      {item.sellerName} · <MapPin className="size-3 text-primary ml-1" />
                      {item.location}
                    </p>
                  </div>

                  {item.isDemo && (
                    <span className="rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase shrink-0">
                      DEMO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Available Stock</span>
                    <span className="font-extrabold text-foreground">
                      {item.quantityAvailable} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Price</span>
                    <span className="font-extrabold text-primary">{item.priceUnit}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Feedstock / Method:</strong>{" "}
                    {item.feedstockMethod}
                  </p>
                  <p>
                    <strong className="text-foreground">Batch Date:</strong> {item.batchDate} ·{" "}
                    <strong className="text-foreground">Packaging:</strong> {item.packaging}
                  </p>
                  <p className="line-clamp-2">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground capitalize">
                  Delivery: {item.deliveryOption.replace("_", " ")}
                </span>
                <button
                  type="button"
                  onClick={() => setEnquiryTarget(item)}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Request Quote / Enquiry
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Educational Extension Section: Responsible Organic Waste Management */}
        <section className="rounded-3xl border bg-gradient-to-br from-lime-50/60 via-card to-card dark:from-lime-950/20 dark:via-card dark:to-card p-5 sm:p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Recycle className="size-5 text-lime-700 dark:text-lime-400" />
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Responsible Organic Waste Management & Composting
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Practical scientific guidelines from Krishi Vigyan Kendra extension specialists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl border bg-card p-3.5 space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                1. 60-Day Pit Method
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Layer dry crop residues (straw/stalks) and wet green biomass with thin cattle dung
                slurry. Maintain 50–60% moisture. Turn twice at day 21 and day 42 for aerobic
                thermophilic digestion.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-3.5 space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                2. Earthworm Vermiculture
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Use compost worms (<em>Eisenia fetida</em> or <em>Eudrilus eugeniae</em>).
                Pre-decompose manure for 15 days to release heat before adding worms. Harvest
                crumbly casting rich in plant enzymes.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-3.5 space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                3. Safety & Maturity Check
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Never apply raw, hot unfermented manure directly to crop roots (risks nitrogen burn
                and root grub). Fully matured compost is cool, dark brown, and smells like fresh
                forest soil.
              </p>
            </div>
          </div>
        </section>

        {/* Modal: List Organic Manure */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border bg-card p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-display text-base font-bold text-foreground">
                  List Organic Fertilizer / Manure Product
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Matured Eudrilus Earthworm Vermicompost"
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Seller / FPO Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodSeller}
                      onChange={(e) => setProdSeller(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Category *
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) =>
                        setProdCategory(e.target.value as FertilizerListing["category"])
                      }
                      className="h-10 w-full rounded-xl border bg-background px-3 font-semibold"
                    >
                      <option value="vermicompost">Vermicompost</option>
                      <option value="farmyard_manure">Pit Manure (FYM)</option>
                      <option value="jeevamrutha">Jeevamrutha</option>
                      <option value="bio_fertilizer">Bio-Fertilizer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Feedstock & Preparation Method *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Desi cattle dung, sugarcane bagasse fermented 60 days"
                    value={prodFeedstock}
                    onChange={(e) => setProdFeedstock(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Available Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={prodQty}
                      onChange={(e) => setProdQty(Number(e.target.value) || 1)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Unit</label>
                    <select
                      value={prodUnit}
                      onChange={(e) =>
                        setProdUnit(e.target.value as "quintal" | "tonne" | "kg" | "litre")
                      }
                      className="h-10 w-full rounded-xl border bg-background px-2 font-semibold"
                    >
                      <option value="quintal">Quintal</option>
                      <option value="tonne">Tonne</option>
                      <option value="kg">kg</option>
                      <option value="litre">Litre</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Price (₹ / Unit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value) || 1)}
                      className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Location / Taluk
                    </label>
                    <input
                      type="text"
                      value={prodLocation}
                      onChange={(e) => setProdLocation(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Batch Preparation Date
                    </label>
                    <input
                      type="date"
                      value={prodBatchDate}
                      onChange={(e) => setProdBatchDate(e.target.value)}
                      className="h-10 w-full rounded-xl border bg-background px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Packaging & Delivery
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 50 kg HDPE bags"
                      value={prodPackaging}
                      onChange={(e) => setProdPackaging(e.target.value)}
                      className="h-10 rounded-xl border bg-background px-3"
                    />
                    <select
                      value={prodDelivery}
                      onChange={(e) =>
                        setProdDelivery(
                          e.target.value as "transporter_share" | "self_pickup" | "seller_delivery",
                        )
                      }
                      className="h-10 rounded-xl border bg-background px-2 font-semibold"
                    >
                      <option value="transporter_share">Transporter Share</option>
                      <option value="self_pickup">Self Pickup</option>
                      <option value="seller_delivery">Seller Delivery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full rounded-xl border bg-background p-2.5"
                  />
                </div>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Check className="size-4" />
                  <span>Publish Fertilizer Listing</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Send Enquiry */}
        {enquiryTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border bg-card p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Enquire: {enquiryTarget.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Seller: {enquiryTarget.sellerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnquiryTarget(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSendEnquiry} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Farmer / FPO representative"
                    className="h-10 w-full rounded-xl border bg-background px-3"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Required Quantity ({enquiryTarget.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    defaultValue={10}
                    className="h-10 w-full rounded-xl border bg-background px-3 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Send className="size-4" />
                  <span>Send Enquiry to Seller</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
