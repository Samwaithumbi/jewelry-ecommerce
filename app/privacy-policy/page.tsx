
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Lumina Jewels",
  description:
    "Learn how Lumina Jewels handles personal information during application development and testing.",
};

const sections = [
  {
    title: "1. About this application",
    content:
      "LUMINA JEWELS is currently a jewelry e-commerce application in development and testing. Features and data-handling practices may change before commercial launch.",
  },
  {
    title: "2. Information we may collect",
    content:
      "Depending on the features you use, the application may process account details, names, email addresses, telephone numbers, delivery details, cart contents, wishlist items, order information, product preferences, and technical logs. Only information actually collected by the enabled features should be considered applicable.",
  },
  {
    title: "3. How information is used",
    content:
      "Information may be used to test registration and authentication, manage shopping carts and wishlists, display products, process test orders, troubleshoot errors, protect application security, and improve the user experience.",
  },
  {
    title: "4. Payments",
    content:
      "Payment features may be unavailable, operate in a sandbox, or use a live integration depending on the current configuration. Do not assume a payment is simulated. Check the payment environment before initiating a transaction, and never share your M-Pesa PIN or account password with the application operator.",
  },
  {
    title: "5. Third-party services",
    content:
      "The application may use hosting, database, authentication, image-storage, email, and payment providers. Information may be processed by these providers when their services are enabled. Applicable providers and data transfers will be documented as the application moves toward launch.",
  },
  {
    title: "6. Cookies and technical data",
    content:
      "The application may use cookies or session identifiers for authentication, shopping-cart functionality, security, and other enabled features. Any optional analytics or advertising technologies should be disclosed and configured in accordance with applicable law.",
  },
  {
    title: "7. Data retention and security",
    content:
      "Information should be retained only as long as necessary for testing, service operation, security, or applicable legal obligations. Appropriate safeguards should protect stored information. No system can be guaranteed completely secure.",
  },
  {
    title: "8. Your privacy rights",
    content:
      "Depending on applicable law, you may have rights to access, correct, object to the processing of, or request deletion of personal information. You may also have rights relating to consent and complaints. Requests can be made through the channel provided by the application operator when available.",
  },
  {
    title: "9. Children's privacy",
    content:
      "The application is not intended to collect children's personal information in circumstances prohibited by law or without any authorization required by law. Testers should avoid submitting unnecessary personal or sensitive information.",
  },
  {
    title: "10. Changes to this policy",
    content:
      "This policy may be updated as the application develops. The published version should reflect the application's actual features, data practices, providers, and applicable legal obligations.",
  },
];

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-stone-500">
            Last updated: October 15, 2026
          </p>

          <div
            role="status"
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <p className="font-semibold text-amber-900">
              Application under development
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Lumina Jewels is currently being tested. Some features and
              integrations may change before launch. This notice does not
              remove any privacy obligations that apply to information
              actually collected.
            </p>
          </div>

          <p className="mt-6 leading-7 text-stone-600">
            This policy explains how personal information may be handled
            when you use the Lumina Jewels website. We aim to comply with
            applicable data protection laws, including Kenya&apos;s Data
            Protection Act, 2019.
          </p>
        </header>

        <nav
          aria-label="Privacy policy contents"
          className="mt-8 rounded-xl border border-stone-200 bg-white p-5"
        >
          <h2 className="font-semibold">On this page</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#privacy-${index + 1}`}
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
              id={`privacy-${index + 1}`}
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
            This development-stage policy must be reviewed and updated to
            reflect actual data practices before commercial launch. It is
            not a substitute for legal advice.
          </p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm">
            <Link
              href="/terms-and-conditions"
              className="font-medium text-amber-800 hover:underline"
            >
              Terms &amp; Conditions
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
