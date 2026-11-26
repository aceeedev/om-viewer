import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_PHOTOS, SAMPLE_SOURCE_PAGE } from "@/lib/sample-photos";
import { InfoPage, InfoSection } from "../_components/info-page";
import { ExternalLink, TEXT_LINK } from "../_components/text-link";

export const metadata: Metadata = {
  title: "About",
  description:
    "What OM Recipe Viewer does, which photos it reads, and who made the sample photos. An independent tool, not affiliated with OM Digital Solutions.",
};

const REPO_URL = "https://github.com/aceeedev/om-viewer";
const AUTHOR_URL = "https://www.linkedin.com/in/andrew-michael-collins/";

export default function AboutPage() {
  return (
    <InfoPage
      title="About"
      intro="OM Recipe Viewer shows the picture settings, or recipe, that an OM System camera saved in a photo."
    >
      <InfoSection title="What it does">
        <p>
          When an OM System camera takes a JPEG, it stores the settings behind the shot in the file&apos;s maker
          notes: the Color Profile or Monochrome Profile Control, picture mode, highlight and shadow tone,
          white balance and more. Open a photo here and the viewer reads those notes and shows the recipe, so
          you can see how a shot was made or set up the same look on your own camera.
        </p>
        <p>
          The Simple view draws the settings the way the camera&apos;s own screens do. Full details lists every
          setting it decoded, with the raw maker-note values underneath.
        </p>
        <p>
          The photo is read in your browser. It isn&apos;t uploaded anywhere. See the{" "}
          <Link href="/privacy" className={TEXT_LINK}>
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
      </InfoSection>

      <InfoSection title="Which photos work">
        <p>
          JPEGs from OM System cameras, and from Olympus cameras that use the same maker-note format. It has been
          tested most with photos from the OM-3 and PEN.
        </p>
        <p>
          A photo needs its original metadata. Photos sent through social media or messaging apps, or exported
          from an editor, often lose their maker notes, and then there&apos;s no recipe left to read. The file
          straight off the camera&apos;s card works best.
        </p>
      </InfoSection>

      <InfoSection title="Sample photos">
        <p>
          The photos behind &ldquo;Try a sample&rdquo; are Creative Profiles made by OM SYSTEM Ambassador
          photographers, published on <ExternalLink href={SAMPLE_SOURCE_PAGE.url}>{SAMPLE_SOURCE_PAGE.title}</ExternalLink>.
          They&apos;re shown here as smaller copies, with the camera and lens serial numbers removed. Each photo
          belongs to the photographer who made it.
        </p>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {SAMPLE_PHOTOS.map((photo) => (
            <li key={photo.name}>
              <span className="font-medium text-black">&ldquo;{photo.title}&rdquo;</span> by{" "}
              <ExternalLink href={photo.artistUrl}>{photo.artist}</ExternalLink>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Not affiliated with OM System">
        <p>
          OM Recipe Viewer is an independent project. It isn&apos;t affiliated with or endorsed by OM Digital
          Solutions. OM SYSTEM, PEN and Olympus are trademarks of their owners.
        </p>
      </InfoSection>

      <InfoSection title="Who made it">
        <p>
          OM Recipe Viewer is made by <ExternalLink href={AUTHOR_URL}>Andrew Collins</ExternalLink>. The code is
          on <ExternalLink href={REPO_URL}>GitHub</ExternalLink>. If a photo doesn&apos;t open or shows the wrong
          settings, please open an issue there.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
