import type { Section } from "./sections";

/** A titled table of settings: label, value, and the camera's range. */
export function SettingsTable({ section }: { section: Section }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {section.title}
      </h3>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {section.rows.map((row) => (
            <tr key={row.label} className="border-t border-zinc-200 align-top dark:border-zinc-800">
              <th scope="row" className="w-1/2 py-1.5 pr-4 text-left font-normal text-zinc-700 dark:text-zinc-300">
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
              <td className="py-1.5">
                <span className="font-medium tabular-nums">{row.value}</span>
                {row.range && <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">({row.range})</span>}
                {row.unverified && (
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">Unverified: {row.unverified}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
