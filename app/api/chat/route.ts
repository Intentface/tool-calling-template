// @/app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";

// Maximum duration for the API route (in seconds)
export const maxDuration = 30;

const randomOf = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const takeRandom = <T,>(items: T[], count: number): T[] => {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const conditionPool = [
  "radiant auroras with sporadic ion gusts",
  "levitating mist and crystalline snowfall",
  "glittering micro-meteor drizzle",
  "calm plasma tide with soft starlight",
  "low-gravity fog banks swirling over the horizon",
  "polar light storms tracing the skyline",
  "nebula haze with intermittent gamma sparkles",
];

const windPool = [
  "solar breeze at 18 mph",
  "ion drift steady at 9 mph",
  "crosswind bursts peaking at 24 mph",
  "mag-lev gusts oscillating at 12 mph",
  "vacuum pockets causing gentle downdrafts",
  "orbit-synced zephyrs circling at 15 mph",
];

const radiationPool = [
  "radiation index 3 (shielded comfort)",
  "radiation index 5 (medium flare activity)",
  "radiation index 7 (reinforce hull plating)",
  "trace cosmic rays; recommend polarized lenses",
  "gamma sparkle showers (short exposure advised)",
];

const advisoryPool = [
  "Visibility remains crystalline within 20 klicks.",
  "Flux monitors stable; optimal for sightseeing.",
  "Expect static buildup on exposed alloys.",
  "Great time for sub-orbital glides and photo ops.",
  "Solar sails may flutter—tighten your rigging.",
  "Recommended to enable adaptive gravity boots.",
];

type HazardSeverity = "Low" | "Elevated" | "Critical";

const hazardPool: Array<{
  name: string;
  severity: HazardSeverity;
  guidance: string;
}> = [
  {
    name: "Ion Storm Corridor",
    severity: "Critical",
    guidance: "Delay travel or increase shield harmonics by 30%.",
  },
  {
    name: "Rogue Micro-Meteor Swarm",
    severity: "Elevated",
    guidance: "Activate kinetic deflectors; reduce speed under 300 knots.",
  },
  {
    name: "Solar Flare Echo",
    severity: "Elevated",
    guidance: "Switch to reflective plating and route through the dusk-side.",
  },
  {
    name: "Gravity Tide Surge",
    severity: "Critical",
    guidance: "Anchor vessels and reschedule landings two cycles later.",
  },
  {
    name: "Frozen Plasma Sheen",
    severity: "Low",
    guidance: "Engage traction fields; watch for slick docking pads.",
  },
  {
    name: "Resonant Aurora Current",
    severity: "Low",
    guidance: "Tune communicators to backup spectrum to avoid drift.",
  },
];

const eventPool = [
  {
    title: "Europa Ice Bloom",
    detail: "Subsurface geysers crystallize mid-arc, refracting cerulean light.",
  },
  {
    title: "Leviathan Comet Flyby",
    detail:
      "A sapphire tail cuts across the sky—ideal for panoramic observation decks.",
  },
  {
    title: "Titan Dune Choir",
    detail:
      "Ion winds whistle across dunes, creating harmonic resonance at dusk.",
  },
  {
    title: "Rings Bazaar Lightfall",
    detail: "Saturn's rings cast shimmering patterns over local markets.",
  },
  {
    title: "Aurora Cascade Pulse",
    detail: "Aurora curtains ripple in layered waves, best seen at high altitude.",
  },
  {
    title: "Neptune Halo Mirage",
    detail:
      "An atmospheric reflection creates a ghostly second halo for six minutes.",
  },
];

const eventTimePool = [
  "Orbit 22.4",
  "GST + 02h",
  "Local dusk cycle",
  "Solar noon",
  "Three pulses past midnight",
  "Blue giant rising",
];

const windowPool = [
  {
    label: "Calm Corridor",
    window: "21:10 - 22:05 GST",
    note: "Ion flux dips below 10%; ideal for docking maneuvers.",
  },
  {
    label: "Polar Drift Lane",
    window: "04:40 - 05:35 GST",
    note: "Gravity tides neutralize, opening a smooth northbound path.",
  },
  {
    label: "Sunrise Slipstream",
    window: "08:05 - 08:50 GST",
    note: "Solar sail efficiency peaks thanks to coherent breezes.",
  },
  {
    label: "Nightglow Passage",
    window: "16:45 - 17:25 GST",
    note: "Nebula particulates thin out, boosting sensor clarity.",
  },
  {
    label: "Crystalline Approach",
    window: "11:10 - 12:00 GST",
    note: "Docking pads defrost; minimal plasma sheen expected.",
  },
];

// Type definitions for tool results
export interface WeatherResult {
  location: string;
  temperature: number;
  conditions: string;
  wind: string;
  radiation: string;
  advisory: string;
}

export type WeatherWearItem = {
  title: string;
  description: string;
};

export type WeatherWear = {
  suggestions: Array<WeatherWearItem>;
};

export interface HazardScanItem {
  name: string;
  severity: HazardSeverity;
  guidance: string;
}

export interface HazardScanReport {
  location: string;
  riskLevel: HazardSeverity;
  hazards: HazardScanItem[];
}

export interface CelestialEvent {
  title: string;
  time: string;
  detail: string;
}

export type CelestialEventFeed = {
  events: CelestialEvent[];
};

export interface NavigationWindow {
  label: string;
  window: string;
  note: string;
}

export type NavigationWindowGuide = {
  windows: NavigationWindow[];
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    messages: convertToModelMessages(messages),
    system: `You are Vox Solaris, the lead navigator for the Stellar Skies Console in the year 10,245. Speak like a seasoned but upbeat intergalactic meteorologist guiding curious travelers. Combine swagger with genuine care.

When helping a user, orchestrate the following tools thoughtfully:
- "weather" gives you temperature, conditions, wind, radiation, and advisory details for a location. Reach for it first when the atmosphere or environment is unknown.
- "hazardScan" spots dangerous anomalies. Pair it with weather whenever safety, travel, or gear prep is mentioned.
- "navigationWindows" reveals the best departure or arrival windows. Use it when timing, routes, or logistics come up.
- "celestialEvents" shares spectacles worth catching. Offer it for experiential or curiosity-driven requests.
- "whatToWear" returns tailored gear load-outs. Always suggest gear if the traveler could benefit—even if they don't ask directly.

Give playful shorthand summaries, then expand with vivid, actionable detail. Stay in-character; never admit anything is fabricated—commit to the role.`,
    stopWhen: stepCountIs(7),
    tools: {
      weather: tool({
        description:
          "Get conditions, temperature, wind, and radiation details for a location.",
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 42 + Math.floor(Math.random() * 220),
          conditions: randomOf(conditionPool),
          wind: randomOf(windPool),
          radiation: randomOf(radiationPool),
          advisory: randomOf(advisoryPool),
        }),
      }),
      hazardScan: tool({
        description:
          "Scan for orbital hazards and space weather risks impacting a location.",
        inputSchema: z.object({
          location: z
            .string()
            .describe("The target location or travel corridor to scan"),
        }),
        execute: async ({ location }) => ({
          location,
          riskLevel: randomOf<HazardSeverity>(["Low", "Elevated", "Critical"]),
          hazards: takeRandom(hazardPool, 3).map((hazard) => ({
            ...hazard,
            guidance: hazard.guidance,
          })),
        }),
      }),
      navigationWindows: tool({
        description:
          "Recommend ideal navigation windows or launch times for a location.",
        inputSchema: z.object({
          location: z
            .string()
            .describe("The destination or corridor to plan travel around"),
        }),
        execute: async ({ location }) => ({
          windows: takeRandom(windowPool, 3).map((window) => ({
            ...window,
            note: `${window.note} (${location}).`,
          })),
        }),
      }),
      celestialEvents: tool({
        description:
          "Share memorable celestial events to catch near a location.",
        inputSchema: z.object({
          location: z
            .string()
            .describe("The location or region to surface events for"),
        }),
        execute: async () => ({
          events: takeRandom(eventPool, 3).map((event) => ({
            ...event,
            time: randomOf(eventTimePool),
          })),
        }),
      }),
      whatToWear: tool({
        description:
          "List futuristic gear or clothing to wear based on the conditions (up to 3 items).",
        inputSchema: z.object({
          suggestions: z
            .array(
              z.object({
                title: z.string().describe("Title of the equipment"),
                description: z
                  .string()
                  .describe("Description of the equipment"),
              })
            )
            .min(1)
            .max(3)
            .describe("List of space equipment suggestions (up to 3 items)"),
        }),
        execute: async ({ suggestions }) => ({
          suggestions,
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
