import { notFound } from "next/navigation";

// Playback authorization is available only through real course/session records.
export default function TestVideoPage() {
  notFound();
}
