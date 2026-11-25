import { RecipeViewer } from "./_components/recipe-viewer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">OM Recipe Viewer</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          See the picture settings an OM System camera used for a JPEG: Color Profile and Monochrome Profile
          Control, picture mode, highlight &amp; shadow and white balance. Your photo is read in your browser and
          never uploaded.
        </p>
      </header>
      <RecipeViewer />
    </main>
  );
}
