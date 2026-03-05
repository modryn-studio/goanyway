export interface PseoCombo {
  activitySlug: string;
  citySlug: string;
  activityLabel: string;
  cityLabel: string;
}

// 10 activities × 12 cities = 120 pSEO pages.
// Chosen for search volume + activity-first intent ("hiking clubs Denver for adults").
const ACTIVITIES = [
  { slug: 'hiking', label: 'Hiking' },
  { slug: 'book-club', label: 'Book Club' },
  { slug: 'volleyball', label: 'Volleyball' },
  { slug: 'board-games', label: 'Board Games' },
  { slug: 'yoga', label: 'Yoga' },
  { slug: 'running', label: 'Running' },
  { slug: 'trivia-night', label: 'Trivia Night' },
  { slug: 'cycling', label: 'Cycling' },
  { slug: 'tennis', label: 'Tennis' },
  { slug: 'rock-climbing', label: 'Rock Climbing' },
] as const;

const CITIES = [
  { slug: 'denver', label: 'Denver' },
  { slug: 'new-york', label: 'New York' },
  { slug: 'chicago', label: 'Chicago' },
  { slug: 'los-angeles', label: 'Los Angeles' },
  { slug: 'austin', label: 'Austin' },
  { slug: 'seattle', label: 'Seattle' },
  { slug: 'portland', label: 'Portland' },
  { slug: 'boston', label: 'Boston' },
  { slug: 'san-francisco', label: 'San Francisco' },
  { slug: 'nashville', label: 'Nashville' },
  { slug: 'phoenix', label: 'Phoenix' },
  { slug: 'atlanta', label: 'Atlanta' },
] as const;

export function getPseoCombos(): PseoCombo[] {
  return ACTIVITIES.flatMap((activity) =>
    CITIES.map((city) => ({
      activitySlug: activity.slug,
      citySlug: city.slug,
      activityLabel: activity.label,
      cityLabel: city.label,
    }))
  );
}
