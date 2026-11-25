// Fixed teaching inputs, never live network observations or payout forecasts.
export const teachingExample = Object.freeze({
  minerHashrate: 1_000, networkHashrate: 1_000_000,
  targetSeconds: 120, networkDifficulty: 120_000_000,
  assumedReward: 0.5, relativeRate: 0.001,
});
export const teachingScenarios = Object.freeze([
  { hours: 1, hashes: 3_600_000, expectedBlocks: 0.03, grossXmr: 0.015 },
  { hours: 2, hashes: 7_200_000, expectedBlocks: 0.06, grossXmr: 0.03 },
  { hours: 10, hashes: 36_000_000, expectedBlocks: 0.3, grossXmr: 0.15 },
].map((scenario) => Object.freeze(scenario)));
