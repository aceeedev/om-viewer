import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "../_components/info-page";
import { ExternalLink, TEXT_LINK } from "../_components/text-link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "OM Recipe Viewer is free to use and provided as is. Trademarks and sample photos belong to their owners.",
};

const REPO_URL = "https://github.com/aceeedev/om-viewer";
const REPO_ISSUES_URL = `${REPO_URL}/issues`;

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms and Conditions"
      intro="OM Recipe Viewer is free to use and provided as is. By using it, you agree to these terms."
      updated="November 25, 2026"
    >
      <InfoSection title="Using the site">
        <p>
          You can use the site for free, for any lawful purpose, without an account. How it handles your photos
          is covered in the{" "}
          <Link href="/privacy" className={TEXT_LINK}>
            Privacy Policy
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Recipes may not be exact">
        <p>
          The settings are decoded from the camera&apos;s maker notes, which OM Digital Solutions doesn&apos;t
          publicly document. Most were checked against real photos, but some may be read wrongly or be missing,
          especially from cameras that haven&apos;t been tested. Check a recipe on your own camera before you
          rely on it.
        </p>
      </InfoSection>

      <InfoSection title="Provided as is">
        <p>
          The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any
          kind, express or implied. It may change, break or go offline at any time. To the extent the law allows,
          its maker isn&apos;t liable for any loss or damage that comes from using it, or from being unable to.
        </p>
      </InfoSection>

      <InfoSection title="Trademarks">
        <p>
          OM SYSTEM, PEN and Olympus are trademarks of their owners. They&apos;re used here only to say which
          cameras the site works with. OM Recipe Viewer is an independent project, not affiliated with or endorsed
          by OM Digital Solutions.
        </p>
      </InfoSection>

      <InfoSection title="Photos">
        <p>
          The sample photos belong to the photographers who made them, credited on the{" "}
          <Link href="/about" className={TEXT_LINK}>
            About
          </Link>{" "}
          page. They&apos;re shown here to demonstrate the viewer, and using them elsewhere needs their
          owners&apos; permission. If you made one of them and would like it removed,{" "}
          <ExternalLink href={REPO_ISSUES_URL}>open an issue on GitHub</ExternalLink> and it will be taken down.
        </p>
        <p>
          Photos you open stay yours, or their owners&apos;. Opening one here doesn&apos;t give this site any
          rights to it.
        </p>
      </InfoSection>

      <InfoSection title="Source code">
        <p>
          The site&apos;s code is on <ExternalLink href={REPO_URL}>GitHub</ExternalLink>, under the license in
          the repository. That license covers the code only, not the sample photos.
        </p>
      </InfoSection>

      <InfoSection title="Governing law">
        <p>
          These terms are governed by the laws of the State of California, USA, without regard to its
          conflict-of-law rules. Any dispute about the site will be handled in the state or federal courts
          located in California.
        </p>
      </InfoSection>

      <InfoSection title="Changes and questions">
        <p>
          These terms may change. When they do, the date at the top will change with them. For questions,
          please <ExternalLink href={REPO_ISSUES_URL}>open an issue on GitHub</ExternalLink>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
