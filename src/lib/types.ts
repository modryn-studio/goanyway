// Shared types for plan generation and rendering

export interface PlanEvent {
  name: string;
  date: string; // e.g. "Saturday, March 14"
  time: string; // e.g. "10:00 AM"
  venue: string;
  address: string;
  url: string;
  description: string;
  source: 'claude' | 'fallback';
}

export interface ComfortStat {
  percentage: number; // e.g. 68
  label: string; // "of first-timers at Denver hiking clubs came alone"
  reassurance: string; // Claude-generated emotional line
}

export interface PlanBriefing {
  headline: string; // "What to expect at your first Denver hiking club"
  bullets: string[]; // 3 what-to-expect points
  what_to_wear: string;
  vibe: string; // one-sentence vibe check
  comfort_stat: ComfortStat;
}

export interface PlanScript {
  opener: string; // first thing to say
  followups: string[]; // 2-3 follow-up lines
  exit: string; // graceful exit line
  reassurance: string; // Claude-generated 1-sentence reassurance
}

export interface Plan {
  id: string;
  activity: string;
  city: string;
  comfort_level: number;
  event: PlanEvent;
  briefing: PlanBriefing;
  script: PlanScript;
}

export type GenerateRequest = {
  activity: string;
  city: string;
  comfort_level: number;
};

export type GenerateResponse = {
  id: string;
  plan: Plan;
};
