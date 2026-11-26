import { pageMetadata, REPO_ISSUES_URL } from "@/lib/site";
import { InfoPage, InfoSection } from "../_components/info-page";
import { ExternalLink } from "../_components/text-link";

export const metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description: "Your photos are read in your browser and never uploaded. No accounts, cookies or analytics.",
});
const VERCEL_PRIVACY_URL = "https://vercel.com/legal/privacy-notice";

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="Your photos stay on your device. The site has no accounts, no cookies and no analytics."
      updated="November 25, 2026"
    >
      <InfoSection title="Your photos">
        <p>
          When you open a photo, your browser reads it on your device. The photo isn&apos;t uploaded to this
          site or anywhere else, and nothing about it is saved. Close or reload the page and it&apos;s gone.
        </p>
        <p>
          That includes everything in the photo&apos;s metadata, such as the date it was taken and the camera
          and lens serial numbers.
        </p>
      </InfoSection>

      <InfoSection title="Opening a photo by link">
        <p>
          When you paste a link, your browser downloads the image straight from the site that hosts it, without
          going through this site. That site sees the request like any other visit, including your IP address.
          Your browser doesn&apos;t send it your cookies for that site, or which page asked for the image.
        </p>
      </InfoSection>

      <InfoSection title="No cookies, accounts or analytics">
        <p>
          The site doesn&apos;t set cookies, has no accounts, and doesn&apos;t use analytics, ads or trackers.
          It doesn&apos;t save anything in your browser&apos;s storage.
        </p>
        <p>
          The fonts and sample photos are served from this site, so visiting it doesn&apos;t load anything from
          other companies.
        </p>
        <p>
          Because nothing tracks you, there&apos;s nothing for a Do Not Track or Global Privacy Control signal to
          turn off. No personal information is sold or shared.
        </p>
      </InfoSection>

      <InfoSection title="Hosting">
        <p>
          The site is hosted by Vercel. Like any web host, Vercel receives the basic details of each request,
          such as your IP address, your browser and the page you asked for, and may keep them in its logs to run
          and protect its service. See <ExternalLink href={VERCEL_PRIVACY_URL}>Vercel&apos;s privacy notice</ExternalLink>{" "}
          for how it handles them.
        </p>
      </InfoSection>

      <InfoSection title="Links to other sites">
        <p>
          Links to the photographers&apos; Instagram pages, OM SYSTEM and GitHub open those sites, which have
          their own privacy policies.
        </p>
      </InfoSection>

      <InfoSection title="Changes and questions">
        <p>
          If this policy changes, the date at the top will change with it. For questions, please{" "}
          <ExternalLink href={REPO_ISSUES_URL}>open an issue on GitHub</ExternalLink>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
