/**
 * Sample photos for "Try a sample": the Creative Profiles that OM SYSTEM Ambassador photographers made
 * for the OM-3 and PEN, as published on OM SYSTEM's Creative Profiles page. Each profile is shared as a
 * photo whose maker notes hold the recipe.
 *
 * The page serves shrunk copies from public/samples/ (about 0.2–0.7 MB each, against 9–15 MB for the
 * originals), with all metadata kept except camera and lens serial numbers. `source` records where each
 * one came from. To add, change or drop a photo, edit this list, then:
 *   pnpm samples:build   downloads every `source` and rewrites public/samples/ to match the list
 *   pnpm test            checks the committed files open as recipes and carry no serial numbers
 *   pnpm test:samples    checks every `source` still exists and opens (needs the network)
 *
 * Credit `artist` (linking `artistUrl`) wherever a sample is shown, and link SAMPLE_SOURCE_PAGE.
 */

export interface SamplePhoto {
  /** File name under public/samples/. Letters, digits, ".", "_" and "-" only. */
  name: string;
  /** The profile's name, as OM SYSTEM lists it. */
  title: string;
  /** The photographer who made the profile, as credited on the Creative Profiles page. */
  artist: string;
  /** Where the page links the artist (their Instagram). */
  artistUrl: string;
  /** The original full-size photo (https). */
  source: string;
}

/** Where all the samples were found. */
export const SAMPLE_SOURCE_PAGE = {
  title: "OM SYSTEM Creative Profiles",
  url: "https://explore.omsystem.com/us/en/creative-profiles",
} as const;

/** Longest edge of the shrunk copies, in pixels. */
export const SAMPLE_MAX_EDGE = 1600;

const OM_CREATIVE_RECIPES = "https://my.omsystem.com/consumer/media/creative-recipes";

function omRecipe(n: number, title: string, artist: string, instagram: string): SamplePhoto {
  return {
    name: `OM_recipe_sample_${n}.jpg`,
    title,
    artist,
    artistUrl: `https://www.instagram.com/${instagram}/`,
    source: `${OM_CREATIVE_RECIPES}/OM_recipe_${n}.jpg`,
  };
}

// In the page's order, checked 2026-11-25. Titles and credits are copied from the page, except
// "Nostagic Summer", fixed to "Nostalgic Summer", and "Rainforest Vibes Creative Profile", shortened to
// "Rainforest Vibes". The page links OM_recipe_16/17 for SOOJ; _13/_14 are identical copies of those, and
// _19 and _21–_30 answer 403.
export const SAMPLE_PHOTOS: readonly SamplePhoto[] = [
  omRecipe(10, "Dirty Pop", "Luis Chavez", "luichavez"),
  omRecipe(11, "Solar City", "Dan Aragon", "danaragonn"),
  omRecipe(17, "SOOJ - B&W", "Ben Salb", "bens_small_world"),
  omRecipe(1, "Mono Z", "Jerred Z", "jerredz"),
  omRecipe(2, "Nostalgic Summer", "Kyler Steele", "kylersteele"),
  omRecipe(3, "OMTC", "Ali O'Keefe", "onemonthtwocameras"),
  omRecipe(12, "Dark City", "Dan Aragon", "danaragonn"),
  omRecipe(18, "Sundown", "Theron Humphrey", "thiswildidea"),
  omRecipe(4, "Red Soda Pop", "Kitty Marie - Atola Visuals", "atolavisuals"),
  omRecipe(9, "Old Fashioned", "Katie Metka", "katiemetka"),
  omRecipe(5, "Warm & Cool", "Paul Clark", "paulclark"),
  omRecipe(6, "OM-CHROME", "Jonathan Paragas - KingJvpes", "KingJvpes"),
  omRecipe(7, "Nostalgic Hour", "Terry McLaughlin", "asteryx"),
  omRecipe(8, "Rainforest Vibes", "Mindy Michaels", "mindyonthemove"),
  omRecipe(16, "SOOJ - Color", "Ben Salb", "bens_small_world"),
  omRecipe(15, "Sunwashed", "Brad Flowerdew", "bradflowerss"),
  omRecipe(20, "Classic Vivid", "Justin Wong", "justinwongjw"),
];

/** Where the page loads a sample from. */
export function samplePath(photo: SamplePhoto): string {
  return `/samples/${photo.name}`;
}
