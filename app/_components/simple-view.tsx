import type { Recipe } from "@/lib/recipe";
import { pictureModeName } from "./sections";
import { ColorCreatorPanel } from "./simple/color-creator-panel";
import { ColorProfilePanel } from "./simple/color-profile-panel";
import { MonochromeProfilePanel } from "./simple/monochrome-profile-panel";
import { ArtPanel, MonotonePanel, StandardPanel, UnknownModePanel } from "./simple/picture-mode-panels";

/** Only the controls the shot's picture mode lets you edit on the camera. */
export function SimpleView({ recipe }: { recipe: Recipe }) {
  const { profile } = recipe;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold font-stretch-expanded uppercase tracking-widest text-zinc-500">Picture mode</p>
        <h2 className="text-2xl font-extrabold font-stretch-expanded">{pictureModeName(profile.mode)}</h2>
      </div>
      <ModePanels recipe={recipe} />
    </div>
  );
}

function ModePanels({ recipe }: { recipe: Recipe }) {
  const { profile } = recipe;
  switch (profile.kind) {
    case "colorProfile":
      return <ColorProfilePanel profile={profile} recipe={recipe} />;
    case "monochromeProfile":
      return <MonochromeProfilePanel profile={profile} recipe={recipe} />;
    case "colorCreator":
      return <ColorCreatorPanel profile={profile} recipe={recipe} />;
    case "standard":
      return <StandardPanel profile={profile} recipe={recipe} />;
    case "monotone":
      return <MonotonePanel profile={profile} recipe={recipe} />;
    case "art":
      return <ArtPanel profile={profile} recipe={recipe} />;
    case "unknown":
      return <UnknownModePanel recipe={recipe} />;
  }
}
