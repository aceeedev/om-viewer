import { RecipeViewer } from "./_components/recipe-viewer";
import { CONTAINER, PageIntro } from "./_components/site-chrome";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro title="See the recipe behind your photo">
        See the picture settings an OM System camera used for a JPEG: Color Profile and Monochrome Profile
        Control, picture mode, highlight &amp; shadow and white balance.
      </PageIntro>
      <div className={`${CONTAINER} py-10`}>
        <RecipeViewer />
      </div>
    </main>
  );
}
