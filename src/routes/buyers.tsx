import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle, Package, Phone, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Page } from "@/components/AppShell";
import { CropArt } from "@/components/CropArt";
import { CropPicker } from "@/components/CropPicker";
import { rupees } from "@/lib/calc";
import { BUYERS, type CropId } from "@/lib/data";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/buyers")({
  head: () => ({
    meta: [
      { title: "Direct buyers — KisanMandi" },
      { name: "description", content: "Contact grocery apps and FPOs directly, or post your produce." },
      { property: "og:title", content: "Direct buyers — KisanMandi" },
      { property: "og:description", content: "Sell directly to buyers by call or WhatsApp." },
    ],
  }),
  component: Buyers,
});

interface Listing { crop: CropId; qty: number; phone: string; }

function Buyers() {
  const { s, t } = useSettings();
  const [crop, setCrop] = useState<CropId>(s.crop);
  const [qty, setQty] = useState(10);
  const [phone, setPhone] = useState("");
  const [list, setList] = useState<Listing[]>([]);
  useEffect(() => { try { setList(JSON.parse(localStorage.getItem("kisanmandi.listings") ?? "[]")); } catch { /* ignore */ } }, []);
  const post = () => {
    if (!/^\d{10}$/.test(phone)) return;
    const next = [{ crop, qty, phone }, ...list];
    setList(next); localStorage.setItem("kisanmandi.listings", JSON.stringify(next));
  };
  return (
    <Page>
      <main className="grid gap-3">
        <ul className="grid gap-3">
          {BUYERS.map((b) => (
            <li key={b.id} className="rounded-2xl border bg-card p-3">
              <div className="flex items-center gap-3">
                <CropArt id={b.crop} size={52} />
                <div className="flex-1"><p className="text-lg font-bold">{b.name}</p><p className="text-base text-muted-foreground">{t[b.crop]} · {b.weeklyQ} {t.quintal} {t.weekly}</p></div>
                <p className="font-display text-2xl font-extrabold text-primary">{rupees(b.price)}</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a href={`tel:${b.phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground"><Phone className="size-5" />{t.call}</a>
                <a href={`https://wa.me/${b.phone.replace("+", "")}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border text-lg font-bold"><MessageCircle className="size-5" />{t.whatsapp}</a>
              </div>
            </li>
          ))}
        </ul>
        <section className="grid gap-3 rounded-2xl border bg-card p-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Package className="size-6 text-primary" />{t.haveProduce}</h2>
          <CropPicker value={crop} onChange={setCrop} />
          <label className="grid gap-1 text-base">{t.quantity} ({t.quintal})<input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-12 rounded-xl border bg-background px-3 text-xl" /></label>
          <label className="grid gap-1 text-base">{t.phone}<input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="h-12 rounded-xl border bg-background px-3 text-xl" /></label>
          <button onClick={post} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-bold text-primary-foreground"><Send className="size-6" />{t.post}</button>
          {list.length > 0 && <div><p className="font-semibold">{t.myListings}</p>{list.map((l, i) => <p key={i} className="flex items-center gap-2 text-base"><Check className="size-5 text-good" />{t[l.crop]} · {l.qty} {t.quintal}</p>)}</div>}
        </section>
      </main>
    </Page>
  );
}
