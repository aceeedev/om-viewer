import type { RawSetting, Recipe } from "@/lib/recipe";
import { fullSections } from "./sections";
import { CARD, SECTION_TITLE, SettingsTable } from "./settings-table";

/** Every decoded setting, plus the raw maker-note values. */
export function FullView({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-col gap-8">
      {fullSections(recipe).map((section, i) => (
        <SettingsTable key={`${i}-${section.title}`} section={section} />
      ))}
      <RawTable raw={recipe.raw} />
    </div>
  );
}

/** The raw maker-note values, in a card that opens and closes; closed to start with. */
function RawTable({ raw }: { raw: RawSetting[] }) {
  const cell = "py-1.5 pr-3 first:pl-4 last:pr-4";
  return (
    <section className="flex flex-col gap-3">
      <h3 className={SECTION_TITLE}>Maker notes</h3>
      <details className={`group text-sm ${CARD}`}>
        <summary
          className={
            "flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold " +
            "transition-colors hover:bg-zinc-50 [&::-webkit-details-marker]:hidden " +
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black"
          }
        >
          <span>
            All maker-note values <span className="font-normal text-zinc-500">({raw.length})</span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
          >
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="border-t border-zinc-200">
          <p className="px-4 py-3 text-xs text-zinc-500">
            Every entry in the camera&apos;s CameraSettings maker-note block, as stored. Names follow ExifTool.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-y border-zinc-200 bg-zinc-50 text-left text-zinc-500">
                  <th scope="col" className={`${cell} font-medium`}>ID</th>
                  <th scope="col" className={`${cell} font-medium`}>Name</th>
                  <th scope="col" className={`${cell} font-medium`}>Type</th>
                  <th scope="col" className={`${cell} font-medium`}>Value</th>
                </tr>
              </thead>
              <tbody>
                {raw.map((entry) => (
                  <tr key={entry.tag} className="align-top not-first:border-t not-first:border-zinc-100">
                    <td className={cell}>{entry.id}</td>
                    <td className={cell}>{entry.name ?? <span className="text-zinc-400">unknown</span>}</td>
                    <td className={`${cell} whitespace-nowrap`}>
                      {entry.type}
                      {entry.count > 1 ? `[${entry.count}]` : ""}
                    </td>
                    <td className={`${cell} break-all`}>{entry.display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
}
