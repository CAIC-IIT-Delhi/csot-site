export type TrackStatus = "open" | "tba";

/** "started", "tba", or a human-readable date (e.g. "1 June 2026"). */
export type TrackStartDate = "started" | "tba" | (string & {});

export type Track = {
  slug: string;
  name: string;
  /** Clubs running the track, ordered by primary contributor first. */
  clubs: string[];
  /** One-line tagline shown on cards (≤110 chars). */
  tagline: string;
  /** Longer description shown on the track page. */
  about: string;
  status: TrackStatus;
  /** Shown on the track page — started tracks are live; others await a date. */
  startDate: TrackStartDate;
  /**
   * Main entrypoint for the track's material (repo, syllabus, weekly content).
   * Surfaced as a "Launch track" button to registered users only.
   */
  trackUrl?: string;
  /**
   * Dedicated platform (leaderboard / submission portal / contest site) if the
   * track has one. Surfaced as a "Launch platform" button to registered users only.
   */
  platformUrl?: string;
  /** WhatsApp group invite link, shown only to registered users. Set later by organisers. */
  whatsappUrl?: string;
};

export const TRACKS: Track[] = [
  {
    slug: "genai-agentic",
    name: "GenAI / Agentic",
    clubs: ["ARIES"],
    tagline:
      "CI/CD test Build something that reasons, plans, and calls tools. Start from a prompt, end with a working agent.",
    about:
      "A hands-on introduction to large language models and agentic systems. You will go from basic prompting to retrieval augmented generation to tool-using agents that take real actions. We will use open APIs and small models, no GPU required.",
    status: "open",
    startDate: "tba",
    trackUrl: "https://github.com/ishananand06/CSOT26_GenAI-Agentic",
    whatsappUrl:
      "https://chat.whatsapp.com/GCLO74lrEC0G3ciAQmxxra?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "autonomous-control-system",
    name: "Autonomous Control System",
    clubs: ["Aero"],
    tagline:
      "Model a platform, fuse sensors, and close the loop. Control theory for drones and robots, in simulation.",
    about:
      "An introduction to autonomous control for aerial and robotic systems. You will work through dynamics modelling, state estimation, and feedback control using Python and a simulator — no hardware required. By the end you will have built and tuned a controller for a multi-DOF platform and traced the full pipeline from sensors to actuators.",
    status: "open",
    startDate: "30 May 2026",
    trackUrl: "https://github.com/AnirudhBohare/CSOT_26-Autonomous-Aerial-Systems.git",
    whatsappUrl:
      "https://chat.whatsapp.com/DhcbZIZN6WQIn04jOWf8hP?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "quant",
    name: "Quant",
    clubs: ["IGTS", "Eco", "ACES"],
    tagline:
      "Markets through a programmer's lens. Backtesting, signals, and the maths that actually carries weight.",
    about:
      "An entry track into quantitative finance and algorithmic trading. We mix probability, time-series and a small amount of Python tooling. Bring curiosity about markets; we will not assume any finance background.",
    status: "open",
    startDate: "tba",
    trackUrl: "https://github.com/Priyesha710/CSOT-Quant",
    whatsappUrl:
      "https://chat.whatsapp.com/Kx29UoaOAjP7IozQzulpli?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "consult",
    name: "Consult",
    clubs: ["BnC"],
    tagline:
      "Structure messy problems, defend a recommendation, write a deck that lands. Case prep, without the cosplay.",
    about:
      "An introduction to management consulting style problem solving. You will work through real cases, build frameworks, and present a recommendation to a panel. Useful well beyond consulting interviews.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/ParthWadhwa14/CSOT-CONSULT",
    whatsappUrl:
      "https://chat.whatsapp.com/DEJHPXmpBwUIeCfMDit02k?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "analytics",
    name: "Analytics",
    clubs: ["BnC"],
    tagline:
      "Take a dataset, ask the right questions, ship a finding someone can act on.",
    about:
      "Practical data analytics. SQL, light Python, and the soft skill of figuring out what a stakeholder actually wants to know. We use real public datasets and end with a short stakeholder-style writeup.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/ParthWadhwa14/CSOT-ANALYTICS",
    whatsappUrl:
      "https://chat.whatsapp.com/KNdaORR2HP8KdhKjphkLDS?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "product",
    name: "Product",
    clubs: ["ARIES", "BnC"],
    tagline:
      "How an idea becomes a thing people use. PRDs, user interviews, scoping, trade-offs.",
    about:
      "A primer on product thinking. You will pick a small problem, run a handful of user conversations, write a one-page PRD, and prioritise ruthlessly. The track is light on code and heavy on judgement.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/ParthWadhwa14/PRODUCT",
    whatsappUrl:
      "https://chat.whatsapp.com/L6RlF3AeyzXGVQvjNG9cNJ?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "cybersec",
    name: "Cybersec",
    clubs: ["Dev"],
    tagline:
      "Break things, then learn how to stop them. Web, binary, crypto, in the right doses.",
    about:
      "An introduction to applied security through CTF style challenges. Expect web exploitation, basic binary reversing, and just enough crypto. Beginner friendly and laptop friendly.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/itxprashant/CSOT-26-CyberSecurity",
    whatsappUrl:
      "https://chat.whatsapp.com/BJN7duZuObq1gbGPrped0y?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "robotics",
    name: "Robotics",
    clubs: ["Robo"],
    tagline:
      "From a clean motor to something that moves with intent. Hardware, kinematics, and a little control.",
    about:
      "A grounded introduction to robotics. You will work through actuators, sensors, and the control basics that make motion smooth. Where possible we will use a shared lab setup; otherwise everything runs in simulation.",
    status: "tba",
    startDate: "tba",
  },
  {
    slug: "computer-vision",
    name: "Computer Vision",
    clubs: ["ARIES"],
    tagline:
      "Pixels in, structure out. Classical CV first, then where neural networks earn their keep.",
    about:
      "Start with image fundamentals (filtering, features, geometry) and move into modern deep learning approaches. We end with a small project of your choice, scoped to fit a five-week window.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/ishananand06/CSOT26_Computer-Vision",
    whatsappUrl:
      "https://chat.whatsapp.com/GCFws6nRHMYHT4RCOL5ZkF?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "ml-in-proteins",
    name: "ML in Proteins",
    clubs: ["ARIES", "iGEM"],
    tagline:
      "Sequences, structures, alignments — then ML models that bring them together.",
    about:
      "Understanding protein sequences, structures, alignments, and building machine learning models incorporating them. You will work through the basics of how proteins are represented computationally and end with a small model trained on real structural or sequence data.",
    status: "open",
    startDate: "1 June 2026",
    trackUrl: "https://github.com/tanker1202/CSOT_iGEMxARIES_2026",
    whatsappUrl:
      "https://chat.whatsapp.com/FH1nRHql0L45jBqD3e9EpB?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "ml-astronomy",
    name: "ML in Astronomy",
    clubs: ["PAC"],
    tagline:
      "Real telescope data, real ML pipelines. Classify galaxies, hunt for transients, learn the trade.",
    about:
      "A specialised track applying machine learning to astronomy datasets. You will work with public survey data and build a classifier or detector that actually says something useful about the sky.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/itxprashant/csot-ml-astronomy",
    whatsappUrl:
      "https://chat.whatsapp.com/J6PdEyg1ztuEATyQVyzScL?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "devops",
    name: "DevOps",
    clubs: ["Dev"],
    tagline:
      "Take a tiny app and put it on the internet properly. CI, Docker, observability, the works.",
    about:
      "Operate the thing, do not just write the thing. We cover containers, basic CI/CD, infra basics, and how to know your service is actually healthy. You will deploy something small and own its uptime for a week.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/3x3cu73/csot-devops",
    platformUrl: "https://csot-devops.devclub.in/",
    whatsappUrl:
      "https://chat.whatsapp.com/CFle0Vkx4nB48sV68bWCop?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "low-latency",
    name: "Low Latency Software",
    clubs: ["Dev"],
    tagline:
      "Quant-dev flavoured. Tight C++ and Rust, lock-free patterns, measuring nanoseconds honestly.",
    about:
      "A focused track on writing fast systems software. We will profile, optimise, and learn to be suspicious of microbenchmarks. Tilted toward the kind of code that runs inside trading systems.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/itxprashant/CSOT-26-Low-Latency",
    platformUrl: "https://csot-low-latency.devclub.in",
    whatsappUrl:
      "https://chat.whatsapp.com/JYIvxYBy00sJiTEUcMEfzZ?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "competitive-programming",
    name: "Competitive Programming",
    clubs: ["ANCC"],
    tagline:
      "Train for the contests, sharpen the fundamentals. Editorials, weekly sets, honest review.",
    about:
      "A structured five weeks of competitive programming practice. We focus on the topics that show up everywhere (greedy, graphs, DP) and run weekly contests with editorial discussion.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/ancc-iitd/CSOT-2026",
    whatsappUrl:
      "https://chat.whatsapp.com/Kio5lxFgJ8UDNAj7FwgOjr?s=cl&p=a&ilr=0&amv=3",
  },
  {
    slug: "gamedev",
    name: "Gamedev",
    clubs: ["Dev"],
    tagline:
      "From a blank scene to something playable. Engines, loops, and shipping a small game in five weeks.",
    about:
      "A hands-on introduction to game development. You will pick an engine or framework, build core mechanics, and iterate on feel until you have something you can hand to a friend. No prior gamedev experience required — just a laptop and patience for debugging collision boxes.",
    status: "open",
    startDate: "started",
    trackUrl: "https://github.com/MrScratch123/CSOT_Pvt",
    whatsappUrl: "https://chat.whatsapp.com/EoEQzcFARweGKrfvysb9z3",
  },
  {
    slug: "defi-builder-cohort",
    name: "DeFi Builder Cohort",
    clubs: ["BlocSoc"],
    tagline:
      "From AMMs to orderbooks — liquidity, ledger security, and machine-to-machine payments.",
    about:
      "Understand the basics fast, set up the environment, and move on. Shift from constant product to orderbooks and low-latency execution. Understand how speculation drives liquidity and how it breaks. Analyze open ledger flaws and how security is commoditized. Build the machine-to-machine payment layer.",
    status: "open",
    startDate: "1 June 2026",
    trackUrl: "https://github.com/blocsoc-iitd/DeFi-Bootcamp-2026",
    whatsappUrl: "https://chat.whatsapp.com/GQoP8HgrlToHnq2I4LVPiN"
  },
];

export function listTracks(): Track[] {
  return TRACKS;
}

/** Open tracks only — TBA tracks have no leaderboard route or nav entry. */
export function listLeaderboardTracks(): Track[] {
  return TRACKS.filter((t) => t.status === "open");
}

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

export function trackSlugs(): string[] {
  return TRACKS.map((t) => t.slug);
}

export function formatTrackStartDate(startDate: TrackStartDate): string {
  if (startDate === "started") return "Started";
  if (startDate === "tba") return "To be announced";
  return startDate;
}
