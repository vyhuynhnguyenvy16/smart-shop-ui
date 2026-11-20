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

Use a single catalog image-key adapter in `src/lib/products.ts` for current editorial placeholders; replace it with per-product media URLs from the catalog API later so every storefront view remains consistent.

## Design rules
All UI work must follow `DESIGN.md` (colour roles, Be Vietnam Pro type scale, 4px spacing, radius scale,
motion tokens, component specs, accessibility, checklist). Use the tokens/utilities defined in
`src/styles.css`; never hard-code colours, font sizes or animation timings in components.
