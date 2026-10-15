
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | Lumina Jewels",
  description:
    "Terms governing the use of the Lumina Jewels jewelry e-commerce application during development and testing.",
};

const sections = [
  {
    title: "1. Introduction",
    content:
      "These Terms and Conditions govern access to and use of the Lumina Jewels website. The application is currently in development and testing and is not necessarily operating as a fully launched online store.",
  },
  {
    title: "2. Test environment",
    content:
      "Product listings, prices, accounts, carts, wishlists, and orders may be used for testing. A test order does not guarantee product availability, acceptance, fulfilment, or delivery. Do not submit unnecessary personal information while testing.",
  },
  {
    title: "3. Accounts",
    content:
      "Where registration is enabled, provide accurate information and take reasonable steps to protect your account. Do not attempt to access another user's account or interfere with the security of the application.",
  },
  {
    title: "4. Products and prices",
    content:
      "Product descriptions, images, prices, sizes, and availability may change during development. Unless a commercial purchase is explicitly offered and confirmed, test listings should not be treated as a promise to sell or deliver a product.",
  },
  {
    title: "5. Payments",
    content:
      "Payment integrations may use sandbox or live credentials. A payment request must not be assumed to be simulated. Verify the payment environment before proceeding. Any live payment must be handled according to the applicable payment provider's requirements and relevant law.",
  },
  {
    title: "6. Orders and inventory",
    content:
      "Adding an item to a cart or wishlist does not reserve inventory. Test orders may be cancelled or reset as part of development. If real commercial orders are accepted, the operator must communicate order acceptance, availability, charges, and fulfilment arrangements clearly.",
  },
  {
    title: "7. Delivery, returns, and refunds",
    content:
      "Delivery, return, exchange, and refund arrangements for any commercial launch will be disclosed before purchase. This testing version does not establish a delivery promise or a change-of-mind return window. Applicable statutory consumer rights remain unaffected.",
  },
  {
    title: "8. Acceptable use",
    content:
      "Do not use the application for fraud, unlawful activity, unauthorized access, malicious uploads, payment abuse, or interference with the service. Do not misuse another person's information or account.",
  },
  {
    title: "9. Intellectual property",
    content:
      "Website branding, design, text, and other content may be owned by or licensed to their respective rights holders. You may use the website for lawful browsing and testing, but may not copy or commercially exploit protected content without authorization or a legal right to do so.",
  },
  {
    title: "10. Third-party services",
    content:
      "Authentication, hosting, email, storage, delivery, and payment features may depend on third-party providers. Their own terms may apply when you use their services.",
  },
  {
    title: "11. Availability and liability",
    content:
      "Features may be modified, interrupted, or unavailable during testing. Nothing in these Terms excludes liability or consumer rights that cannot lawfully be excluded or restricted.",
  },
  {
    title: "12. Privacy",
    content:
      "Use of personal information is explained in the Privacy Policy. You can review it at the link below. Applicable data protection obligations continue to apply during testing.",
  },
  {
    title: "13. Governing law and disputes",
    content:
      "These Terms are intended to be interpreted consistently with applicable Kenyan law. Any dispute may be raised with the application operator or an appropriate competent authority or court, subject to applicable law.",
  },
  {
    title: "14. Changes",
    content:
      "These Terms may be updated as development progresses. Before commercial launch, the operator should publish finalized terms that accurately identify the responsible business and its actual sales, delivery, payment, cancellation, and refund practices.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-amber-700"
        >
          <span aria-hidden="true">←</span>
          Back to home
        </Link>

        <header className="mt-10 border-b border-stone-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
            Lumina Jewels
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Terms &amp; Conditions
          </h1>

          <p className="mt-4 text-sm text-stone-500">
            Last updated: October 15, 2026
          </p>

          <div
            role="status"
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <p className="font-semibold text-amber-900">
              Development and testing notice
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              This application is being tested. Features, product data,
              and integrations may change. Do not assume orders or payments
              are simulated unless the test environment has been verified.
            </p>
          </div>

          <p className="mt-6 leading-7 text-stone-600">
            By using the application, you agree to follow these Terms
            insofar as they apply under applicable law. These Terms do
            not remove any mandatory consumer or other legal rights.
          </p>
        </header>

        <nav
          aria-label="Terms and conditions contents"
          className="mt-8 rounded-xl border border-stone-200 bg-white p-5"
        >
          <h2 className="font-semibold">On this page</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#terms-${index + 1}`}
                  className="text-sm text-stone-600 underline-offset-4 hover:text-amber-700 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-9">
          {sections.map((section, index) => (
            <section
              key={section.title}
              id={`terms-${index + 1}`}
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <p className="mt-3 leading-7 text-stone-600">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-stone-200 pt-8">
          <p className="text-sm leading-6 text-stone-500">
            These are development-stage terms, not a complete substitute
            for finalized commercial terms or legal advice.
          </p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm">
            <Link
              href="/privacy-policy"
              className="font-medium text-amber-800 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="text-stone-600 hover:text-amber-700"
            >
              Home
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
