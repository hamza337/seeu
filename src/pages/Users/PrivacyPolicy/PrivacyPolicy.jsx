import BackButton from "../../../components/backBtn/backButton";

const PrivacyPolicy = () => {
  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Privacy Policy" />

      {/* Privacy Policy Content */}
      <div className="flex flex-col gap-4 mt-6 text-black">
        <p className="text-2xl font-bold">Privacy Policy for SeeU</p>

        <p>
          At SeeU, we value your privacy and are committed to protecting the personal information you share with us.
          This Privacy Policy outlines the types of information we collect and how we use, store, and protect it.
        </p>

        <h2 className="text-lg font-semibold mt-4">Information Collection and Use</h2>
        <p>
          We collect personal information when you register, upload videos, or search for content within the app.
          This may include your name, email address, and payment details. The videos you upload are stored securely for the purpose of earning revenue.
        </p>

        <h2 className="text-lg font-semibold mt-4">Video Content and Revenue</h2>
        <p>
          When you upload accident-related videos, you agree that they will be used to generate income.
          We may display these videos for other users to view and search, ensuring compliance with local laws and regulations.
          Payments for your uploaded videos are processed through secure payment gateways.
        </p>

        <h2 className="text-lg font-semibold mt-4">Third-Party Links</h2>
        <p>
          SeeU may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties
          and encourage you to review their privacy policies.
        </p>

        <h2 className="text-lg font-semibold mt-4">Data Security</h2>
        <p>
          We take reasonable measures to protect your personal information from unauthorized access, disclosure, or alteration.
          However, no method of transmission over the internet is 100% secure.
        </p>

        <h2 className="text-lg font-semibold mt-4">Changes to Privacy Policy</h2>
        <p>
          We may update this policy from time to time. Any changes will be communicated through the app or by other means,
          and the updated policy will be effective as of the date posted.
        </p>

        <h2 className="text-lg font-semibold mt-4">Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy, please contact us via the app's support section.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
