import { RecipeViewer } from "./_components/recipe-viewer";
import { CONTAINER } from "./_components/site-chrome";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro: an off-white band with the headline centered, as on OM System's own pages. */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className={`${CONTAINER} flex flex-col items-center gap-4 py-12 text-center sm:py-16`}>
          <h1 className="max-w-3xl text-3xl leading-[1.12] font-extrabold font-stretch-expanded text-balance sm:text-4xl">
            See the recipe behind your photo
          </h1>
          <p className="max-w-2xl text-zinc-600">
            See the picture settings an OM System camera used for a JPEG: Color Profile and Monochrome Profile
            Control, picture mode, highlight &amp; shadow and white balance.
          </p>
        </div>
      </section>
      <div className={`${CONTAINER} py-10`}>
        <RecipeViewer />
      </div>
    </main>
  );
}
