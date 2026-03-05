// Single source of truth for all site-wide metadata.
// /project-init fills this in from context.md + brand.md.
// Every other file imports from here — never hardcode site metadata elsewhere.
export const site = {
  name: 'GoAnyway',
  shortName: 'GoAnyway',
  url: 'https://modrynstudio.com/tools/goanyway',
  // Base description — used in <meta description>, manifest, JSON-LD
  description:
    'Stop bailing on your first social event. Enter your activity and city — get a real event, a what-to-expect briefing, and a first-hour script.',
  // Longer form for social cards
  ogTitle: 'GoAnyway | Stop Bailing on Your First Social Event',
  ogDescription:
    'Pick your activity and city. Get one real event, a what-to-expect briefing, and a word-for-word script for your first hour. $9 to stop bailing.',
  founder: 'Luke Hanner',
  // Brand colors — used in manifest theme_color / background_color
  accent: '#F5A623', // warm amber — differentiated from Tailwind amber-500
  bg: '#1A1713', // warm near-black — supports amber accent, avoids cool-gray tech feel
  // Social profiles — used in footer links and Twitter card metadata.
  social: {
    twitter: 'https://x.com/lukehanner',
    twitterHandle: '@lukehanner',
    github: 'https://github.com/modryn-studio/goanyway',
    devto: 'https://dev.to/lukehanner',
    shipordie: 'https://shipordie.club/lukehanner',
  },
} as const;
