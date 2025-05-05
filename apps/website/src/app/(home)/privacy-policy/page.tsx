export default function PrivacyPolicy() {
  return (
    <main className="container relative max-w-[1100px] px-2 py-4 z-[2] lg:py-8">
      <div className="grid grid-cols-1 border-r md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full flex flex-row items-start justify-center border-l border-t border-b p-8 text-center">
          <h2 className="bg-fd-primary text-fd-primary-foreground px-1 text-2xl font-semibold">
            Privacy Policy
          </h2>
        </div>
        <div className="col-span-full flex flex-col items-start justify-center border-l border-t border-b py-8 px-16">
          <ul className="list-decimal">
            <li>
              <b>Controller</b>
              <br />
              The responsible party for data processing on this website is:{" "}
              <br />
              Thorben Klein <br />
              me@tklein.it <br />
            </li>
            <li>
              <b>Collection and Processing of Personal Data</b> <br />
              We collect and process the following personal data that you
              voluntarily provide:
              <ul className="list-disc pl-4">
                <li>Name</li>
                <li>Email address</li>
                <li>
                  Financial transaction data and related payment provider
                  information
                </li>
                <li>Authentication data via Google or GitHub</li>
              </ul>
            </li>
            <li>
              <b>Purpose of Data Processing</b> <br />
              The data collected is used solely for visualization and analysis
              within the app. We do not share your personal data with third
              parties, except for the purpose of authentication with external
              providers (e.g., Google or GitHub).
            </li>
            <li>
              <b>Data Transfers to Third Parties</b> <br />
              For user authentication purposes, we exchange information with the
              following services:
              <ul className="list-disc pl-4">
                <li>Google</li>
                <li>GitHub</li>
              </ul>
              This is done strictly to verify your identity during login.
            </li>
            <li>
              <b>Data Storage and Security</b> <br />
              <ul className="list-disc pl-4">
                <li>All data is hosted via Railway.</li>
                <li>
                  Backups are securely stored using Amazon Web Services (AWS)
                  S3.
                </li>
                <li>
                  Only Thorben Klein has access to the production database,
                  exclusively through a personal admin account.
                </li>
                <li>
                  Row-Level Security (RLS) ensures that users can only access,
                  modify, and delete their own data.
                </li>
              </ul>
            </li>
            <li>
              <b>User Rights</b> <br />
              In accordance with the GDPR, you have the right to:
              <ul className="list-disc pl-4">
                <li>Access your stored data</li>
                <li>Export your data</li>
                <li>Request deletion of your data</li>
              </ul>
              You can manage these rights directly through your user profile or
              by contacting us via email.
            </li>
            <li>
              <b>Account Deletion</b> <br />
              If you choose to delete your account, it will be marked for
              deletion for 30 days. After this period, the account and its
              associated data will be permanently deleted.
              <b>Please note</b>: It may take additional time for all backup
              copies to be fully overwritten and for your data to be completely
              removed from our backup systems.
            </li>
            <li>
              <b> Cookies and Tracking</b> <br />
              We use cookies strictly for functional purposes:
              <ul className="list-disc pl-4">
                <li>To store your current user session and app settings</li>
                <li>
                  One cookie is used by Umami Analytics to anonymously track the
                  number of users and page views
                </li>
              </ul>
            </li>
            <li>
              <b>Changes to This Privacy Policy</b> <br />
              We reserve the right to update this Privacy Policy to comply with
              legal requirements or reflect changes in our services. The current
              version is always available on our website.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
