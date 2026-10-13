<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- All user-facing strings live in src/lib/i18n.ts dictionaries; components read them via useSettings().t — keeps languages easy to add.
- Settings (language, location, crop, transport rate) persist in localStorage via src/lib/store.tsx until accounts/Cloud are added.
- Net-profit and forecast math lives in src/lib/calc.ts (pure, tested) so data sources can be swapped without touching UI.
- Leaflet map is React.lazy-loaded and only rendered after mount to keep it out of SSR and the main bundle.
