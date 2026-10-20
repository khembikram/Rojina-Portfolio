/* ==========================================================================
   Project content — edit here to update work.html and project.html.
   The text below is starter copy: replace it with the real story of each
   project. To use a real image, set `image: 'assets/work/name.jpg'` and the
   generated `cover` art is ignored.
   ========================================================================== */

export const PROJECTS = [
  {
    slug: 'aurora',
    title: 'Aurora Bank',
    category: 'Brand Identity',
    filter: 'brand',
    year: 2026,
    client: 'Aurora Bank',
    role: 'Lead designer',
    services: ['Strategy', 'Logo', 'Visual system', 'Guidelines'],
    cover: `<div class="cover cover--aurora">
      <span class="cover__glyph">A</span>
      <span class="cover__tag">Aurora — Identity system</span>
    </div>`,
    summary: 'A warm, human identity for a digital bank that wanted to feel less like a vault and more like a friend.',
    challenge: 'Banking brands tend to look the same: cold blues, sharp marks and a lot of reassurance. Aurora needed to stand apart while still earning trust from first-time customers.',
    approach: 'The system grows from a single letterform lit by soft gradients that shift with the time of day. A restrained type palette and generous spacing keep it calm; colour carries the emotion.',
    outcome: 'A flexible toolkit covering logo, colour, typography, motion principles and app iconography, documented in a guideline the in-house team can run with.',
  },
  {
    slug: 'mira',
    title: 'Mira Skincare',
    category: 'Packaging',
    filter: 'art',
    year: 2025,
    client: 'Mira',
    role: 'Designer',
    services: ['Packaging', 'Naming', 'Art direction'],
    cover: `<div class="cover cover--mira">
      <span class="cover__pill"></span>
      <span class="cover__sun"></span>
      <span class="cover__word">mira</span>
    </div>`,
    summary: 'Sun-washed packaging for a small-batch skincare line built around simple, honest ingredients.',
    challenge: 'The range had to feel premium on a shelf full of loud claims, while staying affordable to print in small runs.',
    approach: 'Two shapes — a pill and a sun — combine differently on every product. Soft clay colours and a lowercase italic wordmark keep the tone gentle and personal.',
    outcome: 'A packaging family of six products with a shared grid, so new products can be added without redesigning the system.',
  },
  {
    slug: 'fieldnotes',
    title: 'Fieldnotes',
    category: 'Product Design',
    filter: 'digital',
    year: 2025,
    client: 'Fieldnotes',
    role: 'Product designer',
    services: ['UX research', 'UI design', 'Prototyping', 'Design system'],
    cover: `<div class="cover cover--field">
      <div class="phone">
        <span class="phone__head"></span>
        <span class="phone__row"></span>
        <span class="phone__row phone__row--s"></span>
        <span class="phone__card"></span>
        <span class="phone__row"></span>
        <span class="phone__row phone__row--s"></span>
      </div>
    </div>`,
    summary: 'A calm journaling app for researchers who collect notes, photos and voice memos out in the field.',
    challenge: 'Users work outdoors, often one-handed and offline. Existing note apps buried capture behind too many taps.',
    approach: 'Capture is always one tap away, with large touch targets and a high-contrast mode for bright sunlight. Notes sync quietly in the background when a connection returns.',
    outcome: 'An end-to-end product design with a component library and interactive prototypes, ready for development.',
  },
  {
    slug: 'kora',
    title: 'Kora Festival',
    category: 'Art Direction',
    filter: 'art',
    year: 2024,
    client: 'Kora Festival of Sound',
    role: 'Art director',
    services: ['Campaign', 'Poster series', 'Social', 'Signage'],
    cover: `<div class="cover cover--kora">
      <span class="cover__poster">KO<br>RA</span>
      <span class="cover__small">Festival of sound<br>— 26</span>
    </div>`,
    summary: 'A loud, typographic campaign for a three-day music festival.',
    challenge: 'The festival needed one look that worked on huge stage banners, tiny ticket stubs and fast-moving social feeds.',
    approach: 'Oversized, tightly stacked type in a single bright orange. The letters crop and rearrange across formats like a rhythm, so the identity feels like the music.',
    outcome: 'A poster series, social templates, wayfinding and merchandise, all built from one typographic system.',
  },
  {
    slug: 'still',
    title: 'Still — Title Sequence',
    category: 'Motion',
    filter: 'motion',
    year: 2024,
    client: 'Still (short film)',
    role: 'Motion designer',
    services: ['Title design', 'Motion', 'Typography'],
    cover: `<div class="cover cover--still">
      <span class="cover__word">Still.</span>
    </div>`,
    summary: 'An opening title sequence for a quiet short film about memory.',
    challenge: 'The titles had to set a contemplative mood in under a minute without giving the story away.',
    approach: 'Slow concentric ripples spread out from each name, like a stone dropped into still water. The typography holds perfectly still while everything around it moves.',
    outcome: 'A 60-second title sequence plus matching end credits and festival poster.',
  },
];

export const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'brand', label: 'Brand' },
  { key: 'digital', label: 'Digital' },
  { key: 'motion', label: 'Motion' },
  { key: 'art', label: 'Art Direction' },
];
