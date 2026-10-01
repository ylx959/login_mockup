# Frontend conventions

Component-based, co-located architecture (React + TypeScript).

- Each component lives in its own folder: `Cart/Cart.tsx`, `Cart/Cart.module.css`, `Cart/index.ts`.
- When a component grows, its private code goes inside its folder: `components/`, `hooks/`, `lib/` (subcomponents, hooks, helpers, types).
- Code used by only one component/page stays with it. Promote to global (`src/components`, `src/lib`, `src/hooks`, `src/data`, `src/features`) only when genuinely shared by multiple parts of the app.
- All components live in `src/components/` — pages never contain a `components/` folder. `src/pages/<Page>/` holds only the page file and `index.ts`.
- Global styles only in `src/styles` (currently `globals.css`); CSS modules sit next to their component.
- Tests sit next to the code they test (`*.test.ts(x)`); `src/test/setup.ts` is the only shared test file.
- Imports: relative paths inside a component's own folder, `@/` alias for everything else.
- Don't over-engineer: start with the simple 3-file folder and add subfolders only when needed.
