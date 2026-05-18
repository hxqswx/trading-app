import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl font-bold text-[var(--muted)]">404</div>
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="text-sm text-[var(--muted)]">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/">
          <Button variant="default">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
