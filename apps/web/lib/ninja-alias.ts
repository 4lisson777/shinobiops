// Ninja-themed alias generator used during user registration.
// Produces a PascalCase compound word like "SilentBlade" or "SwiftShadow".

const ADJECTIVES = [
  "Silent",
  "Swift",
  "Iron",
  "Shadow",
  "Storm",
  "Dark",
  "Ghost",
  "Steel",
  "Crimson",
  "Hollow",
  "Hidden",
  "Ancient",
  "Scarlet",
  "Thunder",
  "Jade",
  "Blazing",
  "Frozen",
  "Lone",
  "Phantom",
  "Void",
  "Fierce",
  "Veiled",
  "Obsidian",
  "Silver",
  "Vengeful",
]

const NOUNS = [
  "Blade",
  "Shadow",
  "Kunai",
  "Shuriken",
  "Wind",
  "Fang",
  "Hawk",
  "Tiger",
  "Wolf",
  "Serpent",
  "Dragon",
  "Raven",
  "Viper",
  "Crane",
  "Fox",
  "Panther",
  "Scroll",
  "Storm",
  "Smoke",
  "Dagger",
  "Arrow",
  "Lotus",
  "Moon",
  "Flame",
  "Mist",
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/**
 * Generates a random ninja-themed alias by combining an adjective with a noun.
 * Example outputs: "SilentBlade", "SwiftShadow", "IronKunai"
 */
export function generateNinjaAlias(): string {
  const adjective = randomElement(ADJECTIVES)
  const noun = randomElement(NOUNS)
  // Avoid identical adjective and noun (e.g. "ShadowShadow")
  if (adjective === noun) {
    return generateNinjaAlias()
  }
  return `${adjective}${noun}`
}
