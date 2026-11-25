import { readPhotoMetadata } from "@/lib/exif";
import { buildRecipe, type Recipe } from "@/lib/recipe";
import { fetchImageFromUrl } from "./fetch-image";

/** A photo turned into its recipe, or why it couldn't be. `fileName` labels either one on the page. */
export type LoadResult =
  | { ok: true; fileName: string; recipe: Recipe; file: File }
  | { ok: false; fileName: string; message: string };

/** Read a dropped or chosen file. Never throws. */
export async function loadPhotoFile(file: File): Promise<LoadResult> {
  try {
    const result = await readPhotoMetadata(file);
    if (!result.ok) return { ok: false, fileName: file.name, message: result.error.message };
    return { ok: true, fileName: file.name, recipe: buildRecipe(result.metadata), file };
  } catch {
    return { ok: false, fileName: file.name, message: "Something went wrong reading this photo." };
  }
}

/** Download a pasted link in the browser, then read it like a file. Never throws. */
export async function loadPhotoUrl(url: string, signal?: AbortSignal): Promise<LoadResult> {
  const fetched = await fetchImageFromUrl(url, { signal });
  if (!fetched.ok) return { ok: false, fileName: url.trim(), message: fetched.error.message };
  return loadPhotoFile(fetched.file);
}
