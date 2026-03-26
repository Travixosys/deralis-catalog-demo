# DERALIS BUILD DEBRIEF

## 1. PROJECT_META

```yaml
name: Marché Diaspora (deralis-catalog-demo)
purpose: E-commerce catalog for African and Caribbean groceries targeting diaspora consumers in Europe
audience: African/Caribbean diaspora in Western Europe (consumers) and store owners (admin dashboard)
problem_solved: Online access to hard-to-find specialty groceries with order management for store owners
url: N/A
stack: [Next.js 16, React 19, TypeScript 5, TailwindCSS 4, Zustand 5, Radix UI, shadcn/ui, canvas-confetti, lucide-react, class-variance-authority]
repo: travixosys/deralis-catalog-demo
```

## 2. REQUIREMENTS

- Browse product catalog with 32 items across 6 categories
- Search products by name (case-insensitive)
- Filter products by category via toggle pills
- Filter low-stock items via URL query param `?stock=low`
- Add products to cart with quantity controls
- Cart persistence during session via Zustand store
- Checkout form with name, phone, delivery preference, conditional address field
- Order reference generation (`MKT-2026-XXXX` format)
- Order dashboard with KPI cards (total orders, pending, revenue, low stock)
- Order detail sheet with status update capability
- Order status progression: Pending → Confirmed → Packed → Delivered
- Confetti celebration on successful order placement
- Mobile-first responsive design
- Demo controls for simulating incoming orders
- [?] No authentication or user accounts required
- [?] No payment gateway integration needed
- [?] No data persistence beyond session

## 3. DECISIONS

| Decision | Chose | Over | Why | Repeat? |
|---|---|---|---|---|
| State management | Zustand | Redux, Context API | Minimal boilerplate, direct mutations via set(), no providers needed | Yes |
| Component library | shadcn/ui + Radix | Material UI, Chakra | Copy-paste ownership, accessible primitives, full style control | Yes |
| Styling | TailwindCSS 4 (PostCSS) | CSS Modules, styled-components | Utility-first, co-located with markup, v4 PostCSS for flexibility | Yes |
| Variant system | CVA (class-variance-authority) | Inline conditionals | Type-safe variants, composable with cn() utility | Yes |
| Backend | None (client-side only) | API routes, external API | Demo scope — no persistence needed, faster iteration | No for production |
| Data source | Hardcoded mock data | CMS, database, API | Demo purpose, zero infrastructure, instant setup | No for production |
| Icons | lucide-react | heroicons, font-awesome | Tree-shakeable, consistent style, React-native components | Yes |
| Modals | Radix Dialog primitives | react-modal, headlessui | Full animation control, accessible, composable Sheet pattern | Yes |
| Celebration UX | canvas-confetti | CSS-only animation | High-impact visual feedback, minimal bundle cost | Yes for demos |
| Form handling | Manual state + validation | react-hook-form + zod | Sufficient for 4 fields, avoided extra deps | No at scale |

## 4. DEVIATIONS

| What prompt said | What I did | Type | Why |
|---|---|---|---|
| None | None | N/A | N/A |

## 5. PRACTICES

| Practice | Where |
|---|---|
| Hydration mismatch prevention via `mounted` state flag | components/header.tsx:19-22 |
| Fresh data lookup in detail views instead of stale props | components/orders/order-detail-sheet.tsx |
| Quantity ≤ 0 triggers auto-removal from cart | lib/store/cart.ts |
| Suspense boundaries with skeleton fallbacks | app/page.tsx |
| Client/server component boundary at page level | app/cart/page.tsx, app/orders/page.tsx |
| URL query params for cross-page filter state | components/catalog/catalog-client.tsx |
| Horizontal scroll with hidden scrollbar for mobile filters | app/globals.css (.scrollbar-hide) |
| Responsive column hiding via breakpoint classes | components/orders/orders-client.tsx |
| CVA variant definitions co-located with component | components/ui/button.tsx |
| cn() utility for class merging with conflict resolution | lib/utils.ts |
| Feature-grouped component directories | components/catalog/, components/cart/, components/orders/ |
| Constants in UPPER_CASE at module scope | lib/mock-data.ts, components/orders/orders-client.tsx |

## 6. PATTERNS

```yaml
name: Hydration-Safe Client Counter
when_to_use: When rendering server/client shared layout that reads from client-only store
snippet: |
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = useCartStore((s) => s.items.length);
  {mounted && count > 0 && <Badge>{count}</Badge>}
```

```yaml
name: Zustand Store with Derived Actions
when_to_use: When managing cart/order state with computed updates (add, remove, clear)
snippet: |
  export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    addItem: (product) => set((s) => ({ items: mergeOrAdd(s.items, product) })),
    removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  }));
```

```yaml
name: CVA Button Variants
when_to_use: When building reusable UI components with multiple visual variants
snippet: |
  const buttonVariants = cva("inline-flex items-center ...", {
    variants: { variant: { default: "bg-primary ...", outline: "border ..." }, size: { default: "h-10 px-4", sm: "h-9 px-3" } },
    defaultVariants: { variant: "default", size: "default" },
  });
```

```yaml
name: Radix Dialog as Sheet
when_to_use: When building slide-out panels or side sheets from dialog primitives
snippet: |
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed right-0 top-0 h-full w-[400px] ...">
      {children}
    </Dialog.Content>
  </Dialog.Portal>
```

```yaml
name: Client-Side Filtering with useMemo
when_to_use: When filtering/searching static datasets without API calls
snippet: |
  const filtered = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!category || p.category === category)
    ), [search, category]);
```

```yaml
name: Order Reference Generator
when_to_use: When generating sequential references without a database
snippet: |
  const maxNum = orders.reduce((max, o) => {
    const n = parseInt(o.reference.split("-").pop() || "0");
    return n > max ? n : max;
  }, 0);
  return `MKT-2026-${String(maxNum + 1).padStart(4, "0")}`;
```

```yaml
name: Conditional Form Fields
when_to_use: When form fields depend on another field's value (e.g., delivery toggle)
snippet: |
  {deliveryType === "delivery" && (
    <input name="address" required placeholder="Delivery address"
      className="w-full rounded-lg border p-3" />
  )}
```

```yaml
name: KPI Card with Cross-Page Link
when_to_use: When dashboard metrics should link to filtered views in other pages
snippet: |
  <Link href="/catalog?stock=low">
    <div className="rounded-xl border p-4">
      <p className="text-2xl font-bold">{lowStockCount}</p>
      <p className="text-sm text-muted-foreground">Low Stock Items</p>
    </div>
  </Link>
```

## 7. DEPENDENCIES

| Package | Does | Chose over | Why |
|---|---|---|---|
| zustand@5 | Client state management | Redux, Jotai, Context | Zero boilerplate, direct set() mutations, no providers, tiny bundle |
| canvas-confetti@1.9 | Celebration animation on order success | CSS keyframes, lottie | Single function call, no React wrapper needed, high visual impact |
| class-variance-authority@0.7 | Type-safe component variant definitions | Conditional classnames | Enforces variant contract, composable with cn(), IDE autocomplete |
| @radix-ui/react-dialog@1.1 | Accessible modal/sheet primitives | react-modal, headlessui | Unstyled, composable, handles focus trap/escape/overlay automatically |
| tailwind-merge@3.5 | Resolves Tailwind class conflicts in cn() | Manual ordering | Prevents `bg-red bg-blue` ambiguity, essential for component composition |
| lucide-react@1.7 | SVG icon components | heroicons, react-icons | Tree-shakeable, consistent 24px grid, native React components |

## 8. HARD_PROBLEMS

```yaml
problem: Server/client hydration mismatch when rendering Zustand store values in shared layout
difficulty: ambiguity
solution: Gate client-only content behind a mounted state flag set in useEffect; render null or placeholder on server pass
files: [components/header.tsx]
```

```yaml
problem: Stale data in detail sheet when order status changes while sheet is open
difficulty: complexity
solution: Re-query Zustand store for fresh order data on each render instead of relying on initial prop
files: [components/orders/order-detail-sheet.tsx]
```

```yaml
problem: Unique order reference generation without a database or server
difficulty: constraints
solution: Scan existing orders array for max reference number, increment, pad to 4 digits
files: [lib/store/cart.ts]
```

## 9. TECH_DEBT

1. [FRAGILE] No data persistence — orders/cart lost on page refresh → add Zustand persist middleware or localStorage adapter
2. [SUBOPTIMAL] STATUS_COLORS duplicated in orders-client.tsx and order-detail-sheet.tsx → extract to shared constant in lib/
3. [INCOMPLETE] No input validation library — phone/address unchecked → add zod + react-hook-form
4. [INCOMPLETE] No error boundaries or error.tsx files → add per-route error boundaries
5. [SUBOPTIMAL] Price calculation duplicated in CartClient and store addOrder → centralize in utility function
6. [FRAGILE] Demo controls component shipped in layout — no feature flag → gate behind env var or remove for production
7. [SUBOPTIMAL] All routes are "use client" — no RSC optimization → evaluate server component opportunities for catalog page
8. [INCOMPLETE] No accessibility audit — missing ARIA labels on tables and some icons → add aria-label attributes

## 10. STYLE_RULES

RULE: Mark all interactive components with `"use client"` directive at file top
RULE: Group components by feature domain in subdirectories under `components/`
RULE: Place shared types in `lib/types.ts`, utilities in `lib/utils.ts`
RULE: Use `cn()` from `lib/utils` for all conditional class merging
RULE: Define component variants with CVA, not inline ternaries
RULE: Use path alias `@/` for all imports from project root
RULE: Name constants in UPPER_SNAKE_CASE at module scope
RULE: Use `useMemo` for client-side filtering of static datasets
RULE: Wrap page-level client components in Suspense with skeleton fallbacks
RULE: Use Radix primitives for modals/dialogs — never raw DOM portals
RULE: Keep Zustand store actions co-located with state definition in single create() call
RULE: Responsive breakpoints: mobile-first, use `sm:` `md:` `lg:` progressive enhancement

## 11. CONTEXT_FOR_NEW_SESSION

- FACT: This is a Next.js 16 + React 19 e-commerce demo called "Marché Diaspora" for African/Caribbean groceries
- FACT: All state lives in a Zustand store (lib/store/cart.ts) — no backend, no database, no API routes
- FACT: UI is built with shadcn/ui components (components/ui/) using Radix primitives and TailwindCSS 4
- FACT: Three main routes: / (catalog), /cart (shopping cart + checkout), /orders (admin dashboard)
- FACT: Components are feature-grouped: components/catalog/, components/cart/, components/orders/
- FACT: Mock data (32 products, 12 seed orders) is hardcoded in lib/mock-data.ts
- FACT: Header uses mounted-state pattern to prevent hydration mismatch with Zustand cart count
- FACT: STATUS_COLORS constant is duplicated in orders-client.tsx and order-detail-sheet.tsx — known tech debt
- FACT: Read Next.js 16 docs in node_modules/next/dist/docs/ before modifying — breaking changes from training data
- FACT: TypeScript strict mode enabled; path alias @/* maps to project root
