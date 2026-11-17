# Velnox Exports — Premium editorial redesign

A complete five-page React + Tailwind site with the existing container-loading scroll hero and a redesigned visual system across the site.

## Run

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Build: `npm run build`. Preview production build: `npm run preview`.

The ZIP contains source, dependency lockfile, production `dist/`, real stock photographs, locally bundled video and poster, and self-hosted Latin WOFF2 display fonts. Serve the website over HTTP; double-clicking built React HTML over file:// is restricted by browsers. Upload the contents of `dist/` to a static web host.

## Five pages

- Home: white scroll hero, green product strip, ivory produce collection mosaic, overlapping About photography, dark-green packaging feature, buyer steps and redesigned enquiry footer.
- Our Products: editorial photograph/header, category tabs, search, product-specific/category photography, detail dialogs and enquiry links.
- Quality & Packaging: matching visual header, specification workflow, evidence discussion and packaging comparison table.
- Buyer Resources: enquiry preparation, buyer checklist, FAQs and commercial-term guidance.
- Contact Us: validated enquiry form, local brief preview/download, optional JSON endpoint and privacy information.

## Design system

Warm ivory #F6F3E9, forest green #173E2A, leaf green #76C457, sage #E6EADB and cream accents. Inter is paired with Instrument Serif italic. Hero display typography remains Anton/Archivo. The design uses a photo mosaic, collage composition, editorial headings, numbered sections, a native SVG packing illustration and subtle scroll/hover feedback. No AI-generated photographs are used.

`src/premium.css` contains the new visual system. `src/index.css` provides Tailwind and shared utilities. `src/App.jsx` contains page UI, product catalogue and enquiry logic. `src/ScrollHero.jsx` and `src/scroll-hero.css` retain the native scrubbed hero.

## Motion and accessibility

The container video is paused and its currentTime follows scroll; vehicles are never moved in code. Wide and phone framing, five linked product cards, blend-mode lettering and cleanup are retained. Reduced-motion visitors get a static, navigable product overview. New section reveals use IntersectionObserver and remain visible without JavaScript/motion support. Mobile menu has focus containment, Escape dismissal, scroll locking and focus restoration. Real links and semantic form labels are retained.

## Form and production setup

Enquiries default to local preview mode. No enquiry is transmitted or persisted by the prototype. Downloading creates a text brief locally.

To enable live sending, copy `.env.example` to `.env`, configure `VITE_ENQUIRY_ENDPOINT` and rebuild. The endpoint must accept JSON POST, validate input, handle CORS, protect against spam and deliver/store requests. Never put secrets in VITE_ variables. The interface shows acceptance only after a successful response; failures preserve entries. A timeout can occur after acceptance, so check before retrying.

Confirm company identity, business contact details, product offering, origin, MOQ, quality requirements, certifications, packaging, price and timing before publication. Replace prototype privacy text with accurate information about actual services and data handling. Configure production-domain canonical URLs, sitemap and robots rules.

## Photography and media

Photos are illustrative stock images, not evidence of Velnox products, operations or facilities. Product details/varieties are not asserted from images. Most catalogue entries have matching product photos; remaining entries use clearly labelled category photographs. Photo asset URLs are recorded in `image-sources.json`.

The supplied container-handling video is illustrative and does not imply Velnox owns the equipment or offers freight services. Verify commercial-use permission for the supplied media before public launch. The original supplied clip is bundled at 1080p and 720p with its poster. Google Fonts still needs network access for Inter, Plus Jakarta Sans and Instrument Serif; the hero fonts and visual assets are bundled.


## Animated inner-page banners
`src/BannerMotion.jsx` and `src/banner-motion.css` provide four distinct decorative scenes: floating produce photographs, a folding packaging illustration, a buyer checklist, and a contact card with moving route lines. Animations pause outside the viewport and respect reduced-motion preferences.

Contact counters animate once on entry: catalogue enquiry options (derived from products.length), sourcing groups (derived from the catalogue categories), and four brief essentials. These are catalogue/workflow counts, not company performance statistics. Update the products data to change the first two totals. Stable final values are provided for screen readers.
