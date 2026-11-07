import type { Metadata } from 'next';
import Link from 'next/link';
import { Band } from '@/components/shared/Band';
import { UiIcon, type UiName } from '@/components/shared/icons';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What PMC Apps keeps, where it keeps it, and what it never sees.',
  alternates: { canonical: `${SITE}/privacy` },
};

const ACCOUNTS = process.env.NEXT_PUBLIC_AUTH !== 'off';

const Tile = ({ n }: { n: UiName }) => <span className="dec-i" aria-hidden><UiIcon name={n} size={30} /></span>;

export default function Privacy() {
  return (
    <>
      <Band title="Privacy" tone="cream" icon={<UiIcon name="lock" size={40} />} />
      <div className="wrap body"><section className="sec" aria-label="Privacy details">
        <div className="panel"><ul className="decisions">
          <li>
            <Tile n="file" /><h2 className="d">Your text and files</h2>
            <p className="tx">Whatever you type, paste or open in an app is worked on inside your browser. It is not sent to PMC Apps. If an app asks for a web address (a picture in Block Coder, say), your browser asks that website for it, and that website can see the request.</p>
          </li>
          <li>
            <Tile n="device" /><h2 className="d">Saved on your device</h2>
            <p className="tx">PMC Apps remembers a few things in your browser so you do not have to set them again: your settings (text size, loading screen, animations), the apps you opened lately, and work-in-progress in some apps. It stays on this device. <Link href="/settings"><u>Settings</u></Link> has a button that clears all of it.</p>
          </li>
          <li>
            <Tile n="unseen" /><h2 className="d">Adverts and tracking</h2>
            <p className="tx">There are no adverts and no analytics or tracking scripts in PMC Apps, and the fonts are served from the site itself. Like any website, whoever hosts it may keep ordinary server logs, such as your IP address and the pages requested.</p>
          </li>
          {ACCOUNTS && (
            <li>
              <Tile n="user" /><h2 className="d">Accounts</h2>
              <p className="tx">An account is optional. If you make one, we keep the name, email address and picture that your sign-in method (Google, Microsoft, GitHub or email) gives us, so we can recognise you next time. A cookie keeps you signed in. You can sign out at any time.</p>
            </li>
          )}
          <li>
            <Tile n="idea" /><h2 className="d">Suggestions</h2>
            <p className="tx">If you send a suggestion, the app name, your description and the email address you choose to add (it is optional) are emailed to ideas@pmcstudios.uk. We use the email only to tell you if the app gets built.</p>
          </li>
          <li>
            <Tile n="mail" /><h2 className="d">Asking about any of this</h2>
            <p className="tx">Email <a href="mailto:ideas@pmcstudios.uk"><u>ideas@pmcstudios.uk</u></a>. Last updated 4 November 2026.</p>
          </li>
        </ul></div>
      </section></div>
    </>
  );
}
