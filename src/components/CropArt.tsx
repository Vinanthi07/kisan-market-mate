import type { CropId } from "@/lib/data";

// Simple illustrated crop pictures (illustration colors are intentional artwork).
export function CropArt({ id, size = 64 }: { id: CropId; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 64 64", "aria-hidden": true } as const;
  switch (id) {
    case "onion":
      return (<svg {...p}><path d="M32 6c2 6 2 8 0 12" stroke="#4d7c0f" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M32 16c-14 6-20 18-14 30 4 8 24 8 28 0 6-12 0-24-14-30z" fill="#a8326e" /><path d="M32 18c-5 8-6 20-2 30M32 18c5 8 6 20 2 30" stroke="#d76aa0" strokeWidth="2" fill="none" /><path d="M26 56l6-4 6 4" stroke="#7c5c3b" strokeWidth="2" fill="none" /></svg>);
    case "tomato":
      return (<svg {...p}><circle cx="32" cy="36" r="22" fill="#dc2626" /><circle cx="24" cy="30" r="5" fill="#f87171" /><path d="M32 14l4 6 7-2-4 6 6 3-8 1-5 5-5-5-8-1 6-3-4-6 7 2z" fill="#16a34a" /></svg>);
    case "maize":
      return (<svg {...p}><path d="M14 56c4-18 6-34 18-46-4 14-6 30-8 46z" fill="#65a30d" /><path d="M50 56c-4-18-6-34-18-46 4 14 6 30 8 46z" fill="#4d7c0f" /><ellipse cx="32" cy="32" rx="9" ry="22" fill="#facc15" />{[18, 26, 34, 42].map((y) => (<path key={y} d={`M24 ${y}h16`} stroke="#ca8a04" strokeWidth="1.5" />))}<path d="M32 10v44" stroke="#ca8a04" strokeWidth="1.5" /></svg>);
    case "potato":
      return (<svg {...p}><path d="M10 34c0-14 14-22 28-20s18 12 16 22-14 18-28 16S10 46 10 34z" fill="#b45309" /><path d="M14 33c1-10 12-16 22-15" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />{[[24, 30], [38, 26], [44, 40], [28, 44]].map(([x, y]) => (<circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#78350f" />))}</svg>);
    case "groundnut":
      return (<svg {...p}><path d="M22 10c10 0 14 8 12 16-1 4 6 6 8 12 3 10-4 18-14 18S12 48 16 38c2-5-6-10-6-18 0-6 6-10 12-10z" fill="#d6a85c" /><path d="M18 22l8 4M16 40l10-2M30 48l8-6M24 14l4 6" stroke="#a16207" strokeWidth="2" /></svg>);
    case "paddy":
      return (<svg {...p}><path d="M32 60V24M32 40c-8-4-14-12-16-22M32 34c8-4 12-12 14-20" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />{[[30, 10], [34, 14], [29, 18], [35, 21], [20, 22], [16, 28], [44, 18], [46, 24]].map(([x, y]) => (<ellipse key={`${x}${y}`} cx={x} cy={y} rx="2.5" ry="4" fill="#eab308" />))}</svg>);
  }
}
