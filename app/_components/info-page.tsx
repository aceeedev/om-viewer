import type { ReactNode } from "react";
import { CONTAINER, PageIntro } from "./site-chrome";

/**
 * A page of text, such as About or Privacy: the intro band with the page's title, then its sections
 * in one narrow column that's comfortable to read.
 */
export function InfoPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro title={title}>{intro}</PageIntro>
      <div className={`${CONTAINER} py-10 sm:py-14`}>
        <div className="mx-auto flex max-w-2xl flex-col gap-10">{children}</div>
      </div>
    </main>
  );
}

/** One titled section of an InfoPage. */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold font-stretch-expanded">{title}</h2>
      <div className="flex flex-col gap-3 leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}
