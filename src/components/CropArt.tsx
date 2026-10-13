import type { CropId } from "@/lib/data";

/**
 * High-clarity SVG crop illustrations with accessible colors and distinct silhouettes.
 */
export function CropArt({ id, size = 64 }: { id: CropId; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    "aria-hidden": true,
    className: "shrink-0",
  } as const;

  switch (id) {
    case "paddy":
      return (
        <svg {...p}>
          <path
            d="M32 60V22M32 40c-8-4-14-12-16-22M32 34c8-4 12-12 14-20"
            stroke="#15803d"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {[
            [30, 10],
            [34, 14],
            [29, 18],
            [35, 21],
            [20, 22],
            [16, 28],
            [44, 18],
            [46, 24],
          ].map(([x, y]) => (
            <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2.5" ry="4" fill="#eab308" />
          ))}
        </svg>
      );

    case "ragi":
      return (
        <svg {...p}>
          <path d="M32 58V24" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          {/* Finger millet finger-like heads */}
          <path
            d="M32 24c-6-10-14-8-18-2M32 24c-2-12-6-16-4-18M32 24c3-14 8-16 10-18M32 24c8-10 16-8 18-2"
            stroke="#b45309"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {[
            [22, 16],
            [28, 10],
            [36, 10],
            [42, 16],
            [16, 20],
            [48, 20],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill="#78350f" />
          ))}
        </svg>
      );

    case "jowar":
      return (
        <svg {...p}>
          <path d="M32 58V26" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
          {/* Sorghum dense panicle head */}
          <ellipse cx="32" cy="18" rx="8" ry="12" fill="#d97706" />
          {[
            [28, 12],
            [36, 12],
            [27, 18],
            [32, 18],
            [37, 18],
            [28, 24],
            [36, 24],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="#fef3c7" />
          ))}
          <path
            d="M32 38c-8-4-14 2-18 6M32 46c8-4 14 2 18 6"
            stroke="#16a34a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case "maize":
      return (
        <svg {...p}>
          <path d="M14 56c4-18 6-34 18-46-4 14-6 30-8 46z" fill="#65a30d" />
          <path d="M50 56c-4-18-6-34-18-46 4 14 6 30 8 46z" fill="#4d7c0f" />
          <ellipse cx="32" cy="32" rx="9" ry="22" fill="#facc15" />
          {[18, 26, 34, 42].map((y) => (
            <path key={y} d={`M24 ${y}h16`} stroke="#ca8a04" strokeWidth="1.5" />
          ))}
          <path d="M32 10v44" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>
      );

    case "wheat":
      return (
        <svg {...p}>
          <path d="M32 58V20" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
          {/* Wheat spikelets with awns */}
          {[-12, -6, 0, 6, 12].map((offset) => (
            <g key={offset}>
              <ellipse
                cx="28"
                cy={26 + offset}
                rx="3"
                ry="5"
                fill="#fde047"
                transform={`rotate(-25 28 ${26 + offset})`}
              />
              <path
                d={`M26 ${24 + offset}l-8-6`}
                stroke="#ca8a04"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <ellipse
                cx="36"
                cy={26 + offset}
                rx="3"
                ry="5"
                fill="#eab308"
                transform={`rotate(25 36 ${26 + offset})`}
              />
              <path
                d={`M38 ${24 + offset}l8-6`}
                stroke="#ca8a04"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>
      );

    case "tur_dal":
      return (
        <svg {...p}>
          {/* Pigeon pea pod */}
          <path
            d="M12 38c8-18 28-24 40-16 2 4-6 18-20 20-8 2-16 0-20-4z"
            fill="#ca8a04"
            stroke="#854d0e"
            strokeWidth="2"
          />
          <circle cx="24" cy="32" r="4" fill="#facc15" />
          <circle cx="34" cy="30" r="4" fill="#facc15" />
          <circle cx="44" cy="28" r="3.5" fill="#facc15" />
          <path d="M12 38c-2 4-4 8-6 12" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "green_gram":
      return (
        <svg {...p}>
          {/* Green gram seeds */}
          <circle cx="32" cy="32" r="18" fill="#15803d" />
          <ellipse cx="26" cy="28" rx="6" ry="9" fill="#16a34a" />
          <circle cx="28" cy="28" r="2" fill="#f0fdf4" />
          <ellipse cx="38" cy="36" rx="5" ry="8" fill="#166534" />
          <circle cx="39" cy="36" r="1.5" fill="#f0fdf4" />
        </svg>
      );

    case "black_gram":
      return (
        <svg {...p}>
          {/* Urad bean */}
          <ellipse cx="32" cy="32" rx="16" ry="20" fill="#1f2937" />
          <ellipse cx="30" cy="30" rx="12" ry="16" fill="#374151" />
          {/* Distinct white hilum line */}
          <path d="M30 20v24" stroke="#f9fafb" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case "chickpea":
      return (
        <svg {...p}>
          {/* Chickpea distinct shape with beak */}
          <path
            d="M32 14c4 4 14 10 14 22 0 10-8 16-14 16s-14-6-14-16c0-12 10-18 14-22z"
            fill="#d97706"
          />
          <path d="M32 14c-1-2-2-4-2-6" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="28" cy="32" rx="5" ry="8" fill="#f59e0b" />
        </svg>
      );

    case "groundnut":
      return (
        <svg {...p}>
          <path
            d="M22 10c10 0 14 8 12 16-1 4 6 6 8 12 3 10-4 18-14 18S12 48 16 38c2-5-6-10-6-18 0-6 6-10 12-10z"
            fill="#d6a85c"
          />
          <path d="M18 22l8 4M16 40l10-2M30 48l8-6M24 14l4 6" stroke="#a16207" strokeWidth="2" />
        </svg>
      );

    case "sunflower":
      return (
        <svg {...p}>
          {/* Sunflower head */}
          <circle cx="32" cy="32" r="12" fill="#78350f" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <ellipse
              key={deg}
              cx="32"
              cy="14"
              rx="4"
              ry="10"
              fill="#facc15"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="8" fill="#451a03" />
        </svg>
      );

    case "sesame":
      return (
        <svg {...p}>
          {/* Sesame capsule & seeds */}
          <path d="M32 10c-6 10-8 24 0 38 8-14 6-28 0-38z" fill="#15803d" />
          <ellipse cx="24" cy="46" rx="4" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <ellipse cx="40" cy="46" rx="4" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <ellipse cx="32" cy="52" rx="4" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );

    case "soybean":
      return (
        <svg {...p}>
          {/* Soybean pod with beans */}
          <path
            d="M16 44c4-16 16-24 32-24 4 6-2 18-12 24-8 4-14 2-20 0z"
            fill="#84cc16"
            stroke="#4d7c0f"
            strokeWidth="2"
          />
          <circle cx="26" cy="36" r="4.5" fill="#facc15" />
          <circle cx="36" cy="32" r="4.5" fill="#facc15" />
        </svg>
      );

    case "tomato":
      return (
        <svg {...p}>
          <circle cx="32" cy="36" r="22" fill="#dc2626" />
          <circle cx="24" cy="30" r="5" fill="#f87171" />
          <path d="M32 14l4 6 7-2-4 6 6 3-8 1-5 5-5-5-8-1 6-3-4-6 7 2z" fill="#16a34a" />
        </svg>
      );

    case "onion":
      return (
        <svg {...p}>
          <path
            d="M32 6c2 6 2 8 0 12"
            stroke="#4d7c0f"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M32 16c-14 6-20 18-14 30 4 8 24 8 28 0 6-12 0-24-14-30z" fill="#a8326e" />
          <path
            d="M32 18c-5 8-6 20-2 30M32 18c5 8 6 20 2 30"
            stroke="#d76aa0"
            strokeWidth="2"
            fill="none"
          />
          <path d="M26 56l6-4 6 4" stroke="#7c5c3b" strokeWidth="2" fill="none" />
        </svg>
      );

    case "potato":
      return (
        <svg {...p}>
          <path d="M10 34c0-14 14-22 28-20s18 12 16 22-14 18-28 16S10 46 10 34z" fill="#b45309" />
          <path
            d="M14 33c1-10 12-16 22-15"
            stroke="#d97706"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {[
            [24, 30],
            [38, 26],
            [44, 40],
            [28, 44],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#78350f" />
          ))}
        </svg>
      );

    case "chilli":
      return (
        <svg {...p}>
          <path
            d="M44 14c-8 6-16 16-20 28-2 6-6 12-8 12s-2-6 2-14c6-14 16-24 24-28z"
            fill="#16a34a"
          />
          <path
            d="M44 14c2-4 6-6 10-4"
            stroke="#15803d"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M40 16c4 0 6 4 6 6" stroke="#4ade80" strokeWidth="2" fill="none" />
        </svg>
      );

    case "brinjal":
      return (
        <svg {...p}>
          {/* Eggplant */}
          <path
            d="M34 16c8 6 16 16 14 28-2 10-12 14-20 12-8-2-12-10-10-20 2-10 10-16 16-20z"
            fill="#581c87"
          />
          <path
            d="M34 16c-2-6-4-10-2-12 2-2 6 2 8 4"
            stroke="#15803d"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M34 16l-6 4 2 6 6-2 4 4 2-6z" fill="#16a34a" />
        </svg>
      );

    case "okra":
      return (
        <svg {...p}>
          {/* Ladyfinger */}
          <path d="M38 12c-4 12-10 26-16 42-2 4-6 2-4-2 6-16 12-30 16-42z" fill="#65a30d" />
          <path d="M38 12l2-4 4 1-2 4z" fill="#3f6212" />
          <path d="M36 14l-12 36" stroke="#a3e635" strokeWidth="1.5" />
        </svg>
      );

    case "banana":
      return (
        <svg {...p}>
          {/* Banana bunch */}
          <path
            d="M42 12c-12 8-22 24-20 38 6-4 18-18 24-32z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          <path
            d="M36 10c-10 8-18 22-16 34 6-4 14-16 20-28z"
            fill="#fde047"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          <path d="M44 10l4-4" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case "mango":
      return (
        <svg {...p}>
          {/* Mango */}
          <path
            d="M32 14c10 2 18 10 16 24-2 14-14 20-22 18-8-2-10-12-8-22 2-10 8-18 14-20z"
            fill="#f59e0b"
          />
          <path d="M22 26c-2 6 0 16 8 18" stroke="#fbbf24" strokeWidth="2" fill="none" />
          <path
            d="M32 14c-1-6 2-10 6-12"
            stroke="#78350f"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M36 10c6-2 10 2 12 6-4 2-8 0-12-6z" fill="#16a34a" />
        </svg>
      );

    case "grapes":
      return (
        <svg {...p}>
          {/* Grape cluster */}
          <path
            d="M32 10c-2-4-6-6-8-4"
            stroke="#78350f"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M32 10c6-2 10 2 12 4-4 2-8 0-12-4z" fill="#16a34a" />
          {[
            [26, 18],
            [34, 18],
            [42, 18],
            [22, 26],
            [30, 26],
            [38, 26],
            [46, 26],
            [26, 34],
            [34, 34],
            [42, 34],
            [30, 42],
            [38, 42],
            [34, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#7e22ce" stroke="#581c87" strokeWidth="1" />
          ))}
        </svg>
      );

    case "coconut":
      return (
        <svg {...p}>
          {/* Brown husked coconut with 3 eyes */}
          <circle cx="32" cy="34" r="20" fill="#78350f" />
          <ellipse cx="28" cy="30" rx="14" ry="16" fill="#92400e" />
          <circle cx="28" cy="24" r="2.5" fill="#451a03" />
          <circle cx="36" cy="24" r="2.5" fill="#451a03" />
          <circle cx="32" cy="32" r="2.5" fill="#451a03" />
          <path d="M32 14l2-6" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg {...p}>
          <circle cx="32" cy="32" r="20" fill="#22c55e" />
          <path d="M32 16v32M16 32h32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}
