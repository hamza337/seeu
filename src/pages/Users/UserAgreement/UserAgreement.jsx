import React from 'react';
import BackButton from "../../../components/backBtn/backButton";

const UserAgreement = () => {
  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Terms & Conditions" />

      {/* User Agreement Content */}
      <div className="flex flex-col gap-4 mt-6 text-black">
        <h2 className="text-lg font-semibold mt-4">1. Introduction</h2>
        <p>
          Welcome to" Poing it" website and App platforms . By accessing or using our services and platform, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you may not use the Platform.
        </p>

        <h2 className="text-lg font-semibold mt-4">2. User Responsibilities</h2>
        <p>- user is over 18 years old.</p>
        <p>- Users must be the rightful owner of any media they upload.</p>
        <p>- Users may not post media that includes nudity, stolen goods, fake photos, or any content used for extortion or abuse.</p>
        <p>- Users may not trade or broker media found on the Platform outside of the Platform itself.</p>
        <p>- Users agree that any violation of these Terms may result in immediate removal from the Platform and deletion of their media at the sole discretion of the administrators.</p>

        <h2 className="text-lg font-semibold mt-4">3. Prohibited Content and Activities</h2>
        <p>Users are strictly prohibited from:</p>
        <p>- Posting or distributing content that is false, misleading, or fraudulent.</p>
        <p>- Uploading media with the intent to extort, harass, or abuse others.</p>
        <p>- Trading or facilitating the trade of any media outside the Platform if it was discovered through the Platform.</p>
        <p>- Posting copyrighted or proprietary content without authorization.</p>
        <p>- Engaging in any unlawful or unethical activity.</p>
        <p>- Posting or distributing content that involves human exploitation, including but not limited to trafficking, forced labor, or any form of abuse.</p>
        <p>- Uploading graphic content depicting violence, torture, or any form of harm intended to shock or disturb others.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>4. Content Authenticity and Safety</strong></h2>
        <p>- Users must ensure that all uploaded media is authentic and not altered to mislead or deceive others.</p>
        <p>- The Platform reserves the right to verify the authenticity of media and remove any content found to be misleading, falsified, or harmful.</p>
        <p>- Users must not upload content that promotes violence, discrimination, hate speech, or any form of exploitation.</p>
        <p>- The Platform may use automated tools and human moderation to ensure content authenticity and safety.</p>
        <p>- Users must not post content that glorifies, incites, or endorses violent acts against individuals or groups.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>5. Content Moderation and Removal</strong></h2>
        <p>The Platform reserves the right to:</p>
        <p>- Remove any content at any time for any reason without prior notice.</p>
        <p>- Suspend or terminate user accounts at the sole discretion of the Platform's administrators.</p>
        <p>- Enforce these Terms through content moderation and user restrictions as necessary.</p>
        <p>- Remove any content that violates these Terms, including but not limited to harmful, false, or misleading information.</p>
        <p>- Allow users to request the removal of their own content, subject to approval by the Platform's administrators.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>6. Account Suspension or Termination</strong></h2>
        <p>- The Platform reserves the right to suspend or terminate any user account at its sole discretion, with or without prior notice, for violations of these Terms, suspected fraudulent activity, or any other reason deemed necessary for the safety and integrity of the Platform.</p>
        <p>- Users whose accounts are suspended or terminated are prohibited from creating new accounts without prior written consent from the Platform's administrators.</p>
        <p>- The Platform reserves the right to retain or delete user content upon account suspension or termination, in compliance with applicable laws and data retention policies.</p>
        <p>- Users may appeal an account suspension or termination by submitting a request through the Platform's support channels. The decision of the Platform's administrators shall be final and binding.</p>
        <p>- The Platform is not liable for any losses, damages, or inconveniences resulting from account suspension or termination.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>7. Username Changes, Account Cancellation, and Content Removal</strong></h2>
        <p>- Users may request a username change through the Platform's support team, subject to availability and compliance with the Platform's guidelines.</p>
        <p>- Users may request account cancellation at any time, and the Platform reserves the right to process such requests within a reasonable timeframe.</p>
        <p>- Upon account cancellation, user content may be removed or retained at the discretion of the Platform, in compliance with data retention policies and legal obligations.</p>
        <p>- The Platform reserves the right to deny a username change or account cancellation if there is an ongoing investigation related to the user's account.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>8. Legacy Contact</strong></h2>
        <p>- Users may designate a person ("Legacy Contact") to manage their account if it is memorialized after their passing or incapacitation.</p>
        <p>- If enabled in the user's settings, only the designated Legacy Contact or a person identified in a valid will or similar legal document expressing clear consent to disclose content will be able to seek limited access to manage the account.</p>
        <p>- The Platform reserves the right to verify legal documents before granting any access.</p>

        <h2 className="text-lg font-semibold mt-4"><strong>9. Liability Disclaimer</strong></h2>
        <p>- The Platform is not liable for any content uploaded by users or the consequences resulting from such content.</p>
        <p>- Users assume full responsibility for their posts and any impact they may have.</p>
        <p>- The Platform does not guarantee the authenticity, legality, or reliability of user-uploaded media.</p>

        <h2 className="text-lg font-semibold mt-4">10. Privacy, Data Protection, and User Dignity</h2>
        <p>- The Platform collects and stores user data in accordance with its Privacy Policy.</p>
        <p>- Users grant the Platform a license to use, store, and display uploaded media as needed for service functionality.</p>
        <p>- The Platform may share user data with third parties in compliance with applicable laws.</p>
        <p>- Users have the right to request data deletion under certain conditions.</p>
        <p>- The Platform is committed to protecting user privacy and ensuring that personal data is not exploited, misused, or unlawfully shared.</p>
        <p>- Users must not share personally identifiable information of others without consent.</p>
        <p>- The Platform will take appropriate actions against harassment, bullying, or any activity that undermines the dignity of users.</p>
        <p>- The Platform strictly prohibits the exploitation, intimidation, or degradation of any individual or group through posted content.</p>

        <h2 className="text-lg font-semibold mt-4">11. Funds Transactions</h2>
        <p>- Users may conduct transactions on the Platform for media brokerage services.</p>
        <p>- The Platform is not responsible for payment disputes or chargebacks between users.</p>
        <p>- Refunds and payment reversals are subject to the Platform's refund policy.</p>
        <p>- The Platform reserves the right to freeze or withhold funds in cases of suspected fraud or violation of these Terms.</p>
        <p>- Users agree to use only approved payment methods for transactions.</p>

        <h2 className="text-lg font-semibold mt-4">12. Dispute Resolution</h2>
        <p>- By using the Platform, users agree to resolve any disputes or claims arising from or related to these Terms through binding arbitration, rather than in court, except for cases that qualify for small claims court.</p>
        <p>- Users waive their rights to participate in a class-action lawsuit or class-wide arbitration.</p>
        <p>- Arbitration will be conducted by a neutral arbitrator, and the decision shall be final and binding.</p>
        <p>- The Platform is not liable for any indirect, incidental, or punitive damages arising from disputes between users or from users' reliance on the Platform's services.</p>
        <p>- If a user disagrees with any part of these Terms, their sole remedy is to stop using the Platform.</p>
        <p>- Any legal claims must be filed within one year of the cause of action arising, or they will be permanently barred.</p>

        <h2 className="text-lg font-semibold mt-4">13. Reporting Violations</h2>
        <p>Users are encouraged to report any abuse, policy violations, or inappropriate content through the Platform's reporting mechanisms.</p>

        <h2 className="text-lg font-semibold mt-4">14. Changes to Terms</h2>
        <p>The Platform reserves the right to modify these Terms at any time. Continued use of the Platform after any changes constitutes acceptance of the revised Terms.</p>

        <p>By using the Platform, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>

        <p>Poingit.com, Poing App, and Poing brand is owned and operated by SeeU corp.</p>

      </div>
    </div>
  );
};

export default UserAgreement;
