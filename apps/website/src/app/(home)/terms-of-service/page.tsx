import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="container relative max-w-[1100px] px-2 py-4 z-[2] lg:py-8">
      <div className="grid grid-cols-1 border-r md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full flex flex-row items-start justify-center border-l border-t border-b p-8 text-center">
          <h2 className="bg-fd-primary text-fd-primary-foreground px-1 text-2xl font-semibold">
            Terms of Service
          </h2>
        </div>
        <div className="col-span-full flex flex-col items-start justify-center border-l border-t border-b py-8 px-16">
          <p className="text-sm font-medium">
            By using our website and services, you agree to these terms. If you
            do not agree, please refrain from using our services.
          </p>
          <br />
          <ul className="list-decimal">
            <li>
              <b>Scope of Application</b> <br />
              These Terms of Service apply to the use of the website and
              services of BudgetBuddyDE, provided by{" "}
              <Link href="https://tklein.it">Thorben Klein</Link>.
            </li>
            <li>
              <b>Eligibility</b> <br />
              Our services are intended for natural persons who wish to manage
              their personal finances. Uploading files unrelated to financial
              documentation is strictly prohibited. In case of violations, we
              reserve the right to suspend or delete your account.
            </li>
            <li>
              <b>Intellectual Property</b> <br />
              All content, functions, and the design of this web application are
              protected by copyright and other intellectual property rights.
              Using our services does not grant you any rights to our
              intellectual property. Reproduction, editing, or redistribution
              requires our prior written consent.
            </li>
            <li>
              <b>Limitation of Liability</b> <br />
              We strive to provide accurate and up-to-date information,
              especially regarding securities or account data. However, we do
              not accept liability for the correctness, completeness, or
              availability of such information. Use of our platform is at your
              own risk. We are only liable for damages caused by intent or gross
              negligence (§ 276 BGB), as well as for injury to life, body, or
              health.
            </li>
            <li>
              <b>Data Protection</b> <br />
              Protecting your personal data is important to us. Please refer to{" "}
              <Link href="/privacy-policy">our Privacy Policy</Link>
              for information on how your data is processed. All uploaded data
              is processed in accordance with the GDPR and will not be shared
              with third parties without your consent.
            </li>
            <li>
              <b>Termination and Deletion</b> <br />
              You may request the deletion of your account at any time. Once we
              receive your request, your account will be scheduled for deletion
              and permanently deleted after 30 days unless the request is
              revoked. To improve our services, we collect anonymized data on
              user activity and page views.
            </li>
            <li>
              <b>Changes to the Terms of Service</b> <br />
              We reserve the right to update these Terms of Service. Any changes
              will be published on our website in a timely manner. Continued use
              of our services constitutes your acceptance of the updated terms.
            </li>
            <li>
              <b>Governing Law and Jurisdiction</b> <br />
              These Terms are governed by the laws of the Federal Republic of
              Germany.
            </li>
          </ul>
        </div>

        <div className="col-span-full flex flex-row items-start justify-center border-l border-t p-8 text-center">
          <h2 className="bg-fd-primary text-fd-primary-foreground px-1 text-2xl font-semibold">
            Contact Us
          </h2>
        </div>
        <div className="col-span-full flex flex-row items-start justify-center border-l border-t border-b p-8 text-center">
          <p className="text-sm font-medium">
            You can reach me at{" "}
            <a
              href="mailto:me@tklein.it"
              className="bg-fd-primary text-fd-primary-foreground"
            >
              me@tklein.it
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
