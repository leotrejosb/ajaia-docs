import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Document not found</h1>
      <p className="mt-2 text-slate-600">It doesn&apos;t exist, or it hasn&apos;t been shared with you.</p>
      <Link href="/documents" className="mt-6 inline-block text-blue-600 underline">
        Back to documents
      </Link>
    </main>
  );
}
