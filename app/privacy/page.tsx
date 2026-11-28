import { pageMetadata, REPO_ISSUES_URL } from "@/lib/site";
import { InfoPage, InfoSection } from "../_components/info-page";
import { ExternalLink } from "../_components/text-link";

export const metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description:
    "Your photos are read in your browser and never uploaded. Google Analytics runs only if you accept its cookies.",
});
const VERCEL_PRIVACY_URL = "https://vercel.com/legal/privacy-notice";
/** Google's page on how it uses data from sites with Google Analytics. Its terms ask sites to link it. */
const GOOGLE_PARTNER_SITES_URL = "https://policies.google.com/technologies/partner-sites";

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="Your photos stay on your device. The site's only cookies are for Google Analytics, and only if you accept them."
      updated="November 28, 2026"
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

      <InfoSection title="No accounts, ads or sales">
        <p>
          The site has no accounts and no ads, and your information isn&apos;t sold or shared for advertising.
          Apart from Google Analytics, everything the site loads comes from the site itself.
        </p>
      </InfoSection>

      <InfoSection title="Cookies and Google Analytics">
        <p>
          If you accept cookies, the site uses Google Analytics to count visits and see how the site is used. It
          records things like the pages you visit, the links you click, your device and browser, and your rough
          location based on your IP address. Google keeps this for up to 14 months, and the cookies expire 2
          years after your last visit.
        </p>
        <p>
          Google Analytics never gets your photos, anything in them, or the links you paste. Your visits
          aren&apos;t linked to your Google account or used to target you with ads. See{" "}
          <ExternalLink href={GOOGLE_PARTNER_SITES_URL}>how Google uses this information</ExternalLink>.
        </p>
        <p>Until you accept, nothing from Google loads and no cookies are set.</p>
      </InfoSection>

      <InfoSection title="Changing your cookie settings">
        <p>
          Use Cookie settings at the bottom of any page to change your answer. Turning cookies off stops Google
          Analytics and deletes its cookies. Your answer is remembered in your browser and never sent anywhere.
        </p>
        <p>If your browser sends a Global Privacy Control signal, Google Analytics stays off and you aren&apos;t asked.</p>
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
