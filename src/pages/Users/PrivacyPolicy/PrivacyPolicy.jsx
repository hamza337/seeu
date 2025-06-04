import BackButton from "../../../components/backBtn/backButton";

const PrivacyPolicy = () => {
  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Privacy Policy" />

      {/* Privacy Policy Content */}
      <div className="flex flex-col gap-4 mt-6 text-black">
        <p className="text-2xl font-bold">Poing Privacy Policy:</p>

        <p>
          At Poing, we value your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines the types of information we collect, how we use, store, and protect it, and your rights under applicable laws.Poing is owned and  operated by SeeU Corp
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Information Collection and Use</h2>
        <p>
          We collect personal information when you register, upload videos or photos, conduct searches, or interact with our services. This may include your:
        </p>
        <ul className="list-disc list-inside ml-4">
            <li>Name</li>
            <li>Email address</li>
            <li>Location data</li>
            <li>Device information</li>
            <li>Payment details (if applicable)</li>
            <li>Uploaded content metadata (e.g., time, GPS location)</li>
        </ul>
        <p>
          This data is used to operate, maintain, and improve our services, as well as to facilitate transactions and personalize user experiences.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Video & Media Content and Revenue</h2>
        <p>
          By uploading media—including accident-related or time/location-specific content—you grant Poing the right to display, promote, and monetize that content, in accordance with your selected preferences and applicable laws. You retain ownership, but Poing is authorized to use, distribute, and license the content to third parties as part of its revenue model. All payouts are processed through secure, third-party payment providers.
        </p>

         <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar technologies to:
        </p>
         <ul className="list-disc list-inside ml-4">
            <li>Recognize you when you log in</li>
            <li>Analyze usage patterns and improve performance</li>
            <li>Remember your preferences</li>
            <li>Deliver relevant ads (if applicable)</li>
        </ul>
        <p>
          You can manage or disable cookies through your browser settings. Please note that some features may not function correctly without cookies.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Third-Party Links</h2>
        <p>
          The Poing platform may contain links to third-party websites or services. These sites are not controlled by SeeU Corp, and we are not responsible for their privacy practices. We recommend reviewing their privacy policies before engaging with them.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to safeguard your personal data against unauthorized access, loss, misuse, or alteration. However, no online system is entirely secure. You use the Poing platform at your own risk, and we encourage users to practice secure account management (e.g., using strong passwords and enabling multi-factor authentication where available).
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Data Retention</h2>
        <p>
          We retain your personal information and uploaded content for as long as your account is active or as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
        </p>
         <ul className="list-disc list-inside ml-4">
            <li><strong>Account Data:</strong> Retained for the duration of your account's existence and up to 90 days after closure unless required for legal or operational reasons.</li>
            <li><strong>Uploaded Media:</strong> Retained while publicly available or monetized; can be removed upon user request, subject to prior licensing or transaction obligations.</li>
            <li><strong>Payment and Transaction Records:</strong> Retained as required by financial regulations and tax laws.</li>
        </ul>
        <p>
          You may request deletion of your personal data at any time, subject to legal or contractual obligations.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Age Restrictions</h2>
        <p>
          Poing is not intended for use by children under the age of 16 (or the equivalent minimum age in your jurisdiction). If we become aware that we have collected data from a child without proper parental consent, we will delete such data promptly.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">GDPR and CCPA Compliance</h2>
        <p>
          If you are located in the European Economic Area (EEA) or California, you have specific rights under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), including:
        </p>
         <ul className="list-disc list-inside ml-4">
            <li>The right to know what data we collect and how it's used</li>
            <li>The right to access, correct, or delete your personal data</li>
            <li>The right to object to or restrict certain types of data processing</li>
            <li>The right to data portability</li>
            <li>The right to opt out of the sale of your personal data (CCPA)</li>
        </ul>
        <p>
          You can exercise these rights by contacting us through the support section in the app or by emailing us at privacy@poing.app.
        </p>

        <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Changes to Privacy Policy</h2>
        <p>
          We may revise this policy from time to time. All updates will be posted on our website or app, and the "Last Updated" date will reflect the most recent changes. Continued use of our services after updates constitutes acceptance of the revised policy.
        </p>

         <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p>
          If you have questions or concerns about this Privacy Policy, your rights, or our data practices, please contact us via the support section within the Poing platform or email us at:
        </p>
        <p className="font-semibold">privacy@poing.app</p>
        <p className="font-semibold">SeeU Corp (d/b/a Poing)</p>

         <div className="h-px bg-gray-300 my-4"></div> {/* Horizontal rule/divider */}

        <p className="text-sm text-gray-600">Last Updated: May 24, 2025</p>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
