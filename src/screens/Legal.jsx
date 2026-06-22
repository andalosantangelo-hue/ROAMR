import { useParams, useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";

const SUPPORT = "admin@roamrapp.org";
const UPDATED = "June 2026";

const DOCS = {
  privacy: {
    title: "Privacy Policy",
    blocks: [
      { p: [`ROAMR ("we") operates the ROAMR app. Questions? Email ${SUPPORT}.`] },
      { h: "1. What we collect", p: [
        "Account: your email or phone number, and (for social sign-in) your name and profile photo.",
        "Profile & content: display name, bio, interests, skills, prompts, and the posts, activities, tribes, comments, listings, and photos you create.",
        "Social graph: who you follow, tribes/activities you join, likes and saves.",
        "Safety info (optional): an emergency contact, trip plans, and any medical details you add are stored privately and shared only on a trip when you choose to share them.",
        "Device & usage: with your consent, privacy-friendly analytics (app opens, feature use), plus push-notification tokens if you enable notifications.",
        "We do not collect your precise GPS location. Place names you type are content you choose to share. Photos are re-encoded on your device before upload, which strips embedded location/EXIF metadata.",
      ] },
      { h: "2. How we use it", p: [
        "To provide and operate the app, surface relevant tribes and activities, send notifications you opt into, keep the community safe, and improve the product. We do not sell your personal data.",
      ] },
      { h: "3. Who processes it", p: [
        "We use Google Firebase (Authentication, Firestore, Storage, Cloud Functions, Cloud Messaging, and — with consent — Analytics) as our data processor. Data is stored on Google Cloud infrastructure under Google's privacy terms.",
      ] },
      { h: "4. Your choices & rights", p: [
        "Delete your account anytime in Profile → Account Settings → Delete account. This permanently removes your profile, content, and uploaded photos.",
        "Download your data anytime in Settings (\"Download my data\").",
        "Turn analytics consent off anytime in Settings.",
        "Depending on your region (e.g. GDPR/CCPA), you may request access, correction, or deletion of your data by emailing us.",
      ] },
      { h: "5. Age", p: [
        "ROAMR is for adults 18 and older. We ask for date of birth at sign-up and do not knowingly collect data from anyone under 18.",
      ] },
      { h: "6. Security & retention", p: [
        "Security rules restrict access so users can only read their own private data (email, phone, tokens, emergency contact, medical info). We retain your data while your account is active and delete it on account deletion.",
      ] },
      { h: "7. Changes", p: [
        "We may update this policy; we'll post the new date here and, for material changes, notify you in the app.",
      ] },
    ],
  },
  terms: {
    title: "Terms of Service",
    blocks: [
      { h: "1. Eligibility", p: ["You must be at least 18 years old to use ROAMR. By using the app you confirm you meet this requirement."] },
      { h: "2. Your account", p: ["You're responsible for your account and the content you post. Keep your login secure."] },
      { h: "3. Acceptable use & user content", p: [
        "You own the content you post but grant us a license to display it in the app. Do not post unlawful, harmful, harassing, or objectionable content.",
        "We operate a zero-tolerance policy for objectionable content and abusive users. You can report content and block users in-app, and we aim to review reports within 24 hours and remove violating content and/or offending users.",
      ] },
      { h: "4. Outdoor activities & meetups — assumption of risk", p: [
        "ROAMR helps people organize real-world outdoor activities and meet other members. These carry real risk.",
        "Outdoor activities (hiking, climbing, water, snow, wheels, etc.) can result in injury or death. You participate entirely at your own risk. ROAMR does not vet, supervise, or guarantee any activity, tribe, event, member, listing, or gear, and is not a party to any meetup or transaction between users.",
        "Meet in public first, share a trip plan, use your own judgment, and assess your own ability and the conditions. To the maximum extent permitted by law, ROAMR is not liable for any injury, loss, or damage arising from activities, meetups, or transactions arranged through the app.",
      ] },
      { h: "5. Marketplace", p: ["Listings are between users; ROAMR does not process payments or guarantee items. Transactions and contact happen directly between buyer and seller."] },
      { h: "6. Disclaimers & limitation of liability", p: ["The app is provided \"as is\" without warranties. To the extent permitted by law, ROAMR's liability is limited and we are not liable for indirect or consequential damages."] },
      { h: "7. Termination", p: ["You may delete your account anytime. We may suspend accounts that violate these terms."] },
      { h: "8. Contact", p: [`Questions about these terms? Email ${SUPPORT}.`] },
    ],
  },
  accessibility: {
    title: "Accessibility",
    blocks: [
      { h: "Our commitment", p: [
        "We want ROAMR to work for everyone. We aim to meet WCAG 2.1 AA where practical: legible type, sufficient color contrast, labeled controls, and keyboard / screen-reader-friendly components.",
        "We're actively improving. If you hit an accessibility barrier, please tell us at " + SUPPORT + " and we'll work to fix it.",
      ] },
    ],
  },
};

export default function Legal() {
  const { doc } = useParams();
  const nav = useNavigate();
  const d = DOCS[doc] || DOCS.privacy;
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">{d.title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-10">
        <h2 className="text-2xl font-extrabold text-brand-navy">ROAMR {d.title}</h2>
        <p className="text-muted text-[13px] mt-1 mb-5">Last updated: {UPDATED}</p>
        {d.blocks.map((b, i) => (
          <div key={i} className="mb-5">
            {b.h && <h3 className="font-bold text-brand-navy text-[15px] mb-1.5">{b.h}</h3>}
            {b.p.map((para, j) => (
              <p key={j} className="text-ink/85 text-[14px] leading-relaxed mb-2">{para}</p>
            ))}
          </div>
        ))}
        <p className="text-center text-muted text-[13px] mt-6">© 2026 ROAMR. Made for the outdoors.</p>
      </div>
    </div>
  );
}
