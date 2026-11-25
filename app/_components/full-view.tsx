import type { RawSetting, Recipe } from "@/lib/recipe";
import { fullSections } from "./sections";
import { SettingsTable } from "./settings-table";

/** Every decoded setting, plus the raw maker-note values. */
export function FullView({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-col gap-6">
      {fullSections(recipe).map((section, i) => (
        <SettingsTable key={`${i}-${section.title}`} section={section} />
      ))}
      <RawTable raw={recipe.raw} />
    </div>
  );
}

function RawTable({ raw }: { raw: RawSetting[] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        All maker-note values ({raw.length})
      </summary>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Every entry in the camera&apos;s CameraSettings maker-note block, as stored. Names follow ExifTool.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="text-left text-zinc-500 dark:text-zinc-400">
              <th scope="col" className="py-1 pr-3 font-medium">ID</th>
              <th scope="col" className="py-1 pr-3 font-medium">Name</th>
              <th scope="col" className="py-1 pr-3 font-medium">Type</th>
              <th scope="col" className="py-1 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {raw.map((entry) => (
              <tr key={entry.tag} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                <td className="py-1 pr-3">{entry.id}</td>
                <td className="py-1 pr-3">{entry.name ?? <span className="text-zinc-400">unknown</span>}</td>
                <td className="whitespace-nowrap py-1 pr-3">
                  {entry.type}
                  {entry.count > 1 ? `[${entry.count}]` : ""}
                </td>
                <td className="break-all py-1">{entry.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
