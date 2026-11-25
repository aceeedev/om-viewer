import type { Section } from "./sections";

/** A Full details section's title: Archivo, wide and extra-bold, like the page's other headings. */
export const SECTION_TITLE = "text-lg font-extrabold font-stretch-expanded";

/** The card a Full details table sits in: a faint outline with faintly rounded corners. */
export const CARD = "overflow-hidden rounded-md border border-zinc-200 bg-white";

/** A titled table of settings: each row's name, then its value with the camera's range after it. */
export function SettingsTable({ section }: { section: Section }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className={SECTION_TITLE}>{section.title}</h3>
      <div className={CARD}>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.label} className="align-top not-first:border-t not-first:border-zinc-200">
                <th scope="row" className="w-2/5 py-2 pr-4 pl-4 text-left font-normal text-zinc-600">
                  <span className="inline-flex items-center gap-2">
                    {row.swatch && (
                      <span
                        aria-hidden="true"
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: row.swatch }}
                      />
                    )}
                    {row.label}
                  </span>
                </th>
                <td className="py-2 pr-4">
                  <span className="font-semibold tabular-nums">{row.value}</span>
                  {row.range && (
                    <span className="ml-2 text-xs whitespace-nowrap text-zinc-500 tabular-nums">({row.range})</span>
                  )}
                  {row.unverified && (
                    <span className="mt-1 block text-xs text-amber-700">Unverified: {row.unverified}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
