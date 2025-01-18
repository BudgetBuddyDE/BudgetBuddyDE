import React from 'react';

export default function PrivacyPolicy() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-24">
      <div className="container space-y-12 px-4 md:px-6">
        <h2 className="text-3xl text-center font-bold tracking-tighter sm:text-5xl">Privacy Policy</h2>

        <ol className="list-decimal max-w-[900px] mx-auto px-4">
          <li>
            <strong>Data Collection</strong>
            <br /> We collect your name, email address, and any financial transaction information and related payment
            provider data that you voluntarily provide.
          </li>
          <li>
            <strong>Purpose of Data Collection</strong>
            <br /> The data collected is used solely for visualization and analysis within the app and is not shared
            with third parties.
          </li>
          <li>
            <strong>Data Transfer</strong>
            <br />
            For authentication purposes, we exchange information with Google and GitHub to verify the user.
          </li>
          <li>
            <strong>Data Storage and Security</strong>
            <br />
            Data is hosted with Railway, and backups are secured via AWS S3. Only Thorben Klein has access to the
            production database, accessible only through his personal admin account. Row Level Security (RLS) ensures
            users can only access, modify, and delete their own data.
          </li>
          <li>
            <strong>User Rights</strong>
            <br />
            Users can export or request the deletion of their data through their profile.
          </li>
          <li>
            <strong>Cookies and Tracking</strong>
            <br />
            We use cookies to store current user sessions and app settings. A cookie is used for Umami Analytics to
            track how many users are using the app and which pages are accessed.
          </li>
        </ol>
      </div>
    </section>
  );
}
