import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {PreferencesSettings} from '@/components/settings/preferences-settings';
import {ProfileSettings} from '@/components/settings/profile-settings';
import {requireSession} from '@/serverAuth';

export const metadata: Metadata = {title: 'Profile settings'};

export default async function ProfileSettingsPage() {
  const session = await requireSession();
  return (
    <PageShell
      title="Profile settings"
      description="Manage identity, password, regional preferences, and account lifecycle."
    >
      <ProfileSettings name={session.user.name} email={session.user.email} />
      <PreferencesSettings />
    </PageShell>
  );
}
