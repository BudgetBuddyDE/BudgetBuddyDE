import React from 'react';

export default function TermsOfService() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-24">
      <div className="container space-y-12 px-4 md:px-6">
        <h2 className="text-3xl text-center font-bold tracking-tighter sm:text-5xl">Terms of Service</h2>

        <ol className="list-decimal max-w-[900px] mx-auto px-4">
          <li>
            <strong>General</strong>
            <br /> Welcome to Budget Buddy. These terms of service govern your use of our platform. By using our
            services, you agree to comply with these terms.
          </li>
          <li>
            <strong>Description of Services</strong>
            <br /> Budget Buddy provides a financial planner and analysis tools for tracking and analyzing your
            transactions, income, and expenses. You can also track your stock portfolio and access information on
            various securities.
          </li>
          <li>
            <strong>Eligibility</strong>
            <br />
            Our services are intended for individuals seeking to manage their finances. Uploading files that do not
            pertain to the documentation of finances is prohibited.
          </li>
          <li>
            <strong>Intellectual Property</strong>
            <br />
            All rights to the web app and its content are owned by Thorben Klein. Use of the app does not grant any
            rights to our intellectual property.
          </li>
          <li>
            <strong>Limitation of Liability</strong>
            <br />
            Budget Buddy is not responsible for the availability and accuracy of securities information. While we strive
            to maintain the security and integrity of your data, we do not accept liability for potential errors.
          </li>
          <li>
            <strong>Termination</strong>
            <br />
            Users can request the deletion of their profile. The account will be scheduled for deletion after 30 days
            unless a cancellation request is submitted. track how many users are using the app and which pages are
            accessed.
          </li>
        </ol>
      </div>
    </section>
  );
}
