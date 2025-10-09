export type AdvancedTherapy = {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: 'transformation' | 'growth';
  dbId: string; // UUID in assessments_enhanced
};

export const advancedTherapies: AdvancedTherapy[] = [
  {
    id: 'grief-alchemist',
    title: 'The Grief Alchemist: Metabolizing Loss into Legacy',
    description:
      'Welcome grief as a sacred visitor, translate its messages, and craft a living legacy that honors enduring love.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '998b7ab2-8cb0-42d6-abc3-2859877d5bd9',
  },
  {
    id: 'logotherapy-codex',
    title: 'The Logotherapy Codex: Forging Meaning in the Chaos',
    description:
      'Discover your path to meaning through creation, love, or courageous attitude—and author your personal mission.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '4f79057f-b9df-4711-8711-7c67719885fa',
  },
  {
    id: 'body-as-oracle',
    title: 'The Body as a Living Oracle: Translating Symptoms into Soul Stories',
    description:
      'Dialogue with the body, decode symbolic messages, and design a somatic release ritual for integration.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '70ee1207-4882-4dc7-a525-6b4500651d4f',
  },
  {
    id: 'time-travelers-passport',
    title: "The Time Traveler's Passport: Past, Present, Future",
    description:
      'Assess your time perspective, reframe a memory, anchor presence, and script a vivid future letter.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '3a37017b-f7ac-48f5-9ad4-f030387178c5',
  },
  {
    id: 'money-temple',
    title: 'The Money Temple: Archeology of Wealth & Worth',
    description:
      'Unearth your earliest money memory, name your archetypes, uncover vows, and write a new covenant.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '72e87332-de94-4b95-9d74-4eba05633f02',
  },
  {
    id: 'wabi-sabi-workshop',
    title: 'The Wabi-Sabi Workshop: Liberation in Imperfection',
    description:
      'Audit the cost of perfectionism, find imperfect beauty, embrace good-enough drafts, and craft compassion.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: 'd653fd0f-7539-47ad-9cf4-2ac50930adc4',
  },
  {
    id: 'creative-spring',
    title: 'The Creative Spring: Mapping Your Unique Flow',
    description:
      'Name your creative archetype, deconstruct flow conditions, meet the inner critic, and design a ritual.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '21563e88-a447-4b2b-aa61-4b6075e52d6d',
  },
  {
    id: 'sovereigns-domain',
    title: "The Sovereign's Domain: The Art of Energetic Boundaries",
    description:
      'Run an energy audit, identify your boundary style, write a Royal Decree, and clear your domain.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: '163963f5-3732-47aa-8b8b-3a87e3e4a3f5',
  },
  {
    id: 'hope-forge',
    title: 'The Hope Forge: Crafting Resilience from Despair',
    description:
      'Shift from passive to active hope, reclaim agency, map pathways, and set your personal hope anchor.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: 'a6270e77-0a4b-4fad-a71e-1bfc65d80a51',
  },
  {
    id: 'legacy-blueprint',
    title: 'The Legacy Blueprint: Living a Life Worth Remembering',
    description:
      'Hear your own eulogy, define legacy pillars, reverse-engineer actions, and choose a daily memento mori.',
    category: 'advanced-therapy',
    tier: 'transformation',
    dbId: 'bec21e51-2558-4f3b-abb3-59b99fdd7e06',
  },
];
