import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { buttonClasses } from "@/lib/buttonStyles";

export const metadata: Metadata = {
  title: "Help — Arab Automators",
  description: "Answers to common questions, plus a direct line to the team on WhatsApp.",
};

const faqs = [
  {
    question: "How do I join a live session?",
    answer:
      "Once you're accepted into a round, you'll get the session links in your confirmation email and inside your dashboard. Sessions are live, in Arabic — just click the link a few minutes early.",
  },
  {
    question: "I didn't receive my confirmation email",
    answer:
      "Check your spam or promotions folder first. If it&apos;s still not there after a few minutes, message us on WhatsApp with the email you signed up with and we&apos;ll sort it out.",
  },
  {
    question: "How do I reset my password?",
    answer: (
      <>
        Head to the{" "}
        <Link href="/forgot-password" className="font-semibold text-text-accent">
          forgot password
        </Link>{" "}
        page and enter your account email. You&apos;ll get a reset link within a couple of minutes.
      </>
    ),
  },
  {
    question: "How can I contact support?",
    answer:
      "The fastest way is WhatsApp — tap the button below and one of us will get back to you directly.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
          <div className="relative mx-auto flex max-w-[720px] flex-col items-start gap-4 px-4 py-12 sm:px-6 sm:py-16 md:py-[72px]">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Support
            </span>
            <h1 className="text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[44px]">
              Need help<span className="text-surface-brand">?</span>
            </h1>
            <p className="max-w-[56ch] text-base leading-relaxed text-text-body">
              Run by two people, so we keep this simple. Look through the common questions below —
              if you&apos;re still stuck, message us directly and we&apos;ll reply as soon as we can.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[720px] px-4 pb-12 sm:px-6 sm:pb-16 md:pb-[72px]">
          <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`flex flex-col gap-2 px-5 py-5 sm:px-7 sm:py-6 ${
                  index < faqs.length - 1 ? "border-b border-border-hairline" : ""
                }`}
              >
                <h2 className="font-display text-[17px] font-bold text-text-strong">
                  {faq.question}
                </h2>
                <p className="text-sm leading-relaxed text-text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 rounded-card border border-surface-brand/25 bg-surface-brand-soft px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] tracking-widest text-text-accent uppercase">
                Still need a hand?
              </span>
              <p className="text-sm leading-relaxed text-text-body">
                Message us on WhatsApp — we read every message ourselves.
              </p>
            </div>
            <a
              href="https://wa.me/201554445243"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "lg")}
            >
              Message us on WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
