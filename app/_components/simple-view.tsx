import type { Recipe } from "@/lib/recipe";
import { profileSections, toneSection } from "./sections";
import { SettingsTable } from "./settings-table";

/** Only the controls the shot's picture mode lets you edit on the camera. */
export function SimpleView({ recipe }: { recipe: Recipe }) {
  const { profile } = recipe;
  const sections = profileSections(profile, { simple: true });
  if (profile.kind !== "art" && profile.kind !== "unknown") {
    const tone = toneSection(recipe.tone);
    if (tone.rows.length > 0) sections.push(tone);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Picture mode</p>
        <h2 className="text-2xl font-semibold">{profile.mode.label}</h2>
      </div>
      {profile.kind === "unknown" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This picture mode isn&apos;t recognized yet
          {profile.mode.id >= 0 ? ` (ID ${profile.mode.id})` : ""}. Switch to Full details to see every
          value the camera recorded.
        </p>
      )}
      {sections.map((section, i) => (
        <SettingsTable key={`${i}-${section.title}`} section={section} />
      ))}
    </div>
  );
}
