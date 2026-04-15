import { notFound } from "next/navigation";

// Grooming service is temporarily hidden from the public site.
// The previous implementation lives at `page.tsx.disabled`.
// Database tables (`grooming_bookings`) and admin tooling remain intact.
export default function GroomingDisabled() {
  notFound();
}
