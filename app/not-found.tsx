import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Ajaia Docs</p>
      <h1 className="mt-3 text-2xl font-bold">This document isn&apos;t available</h1>
      <p className="mt-3 leading-7 text-stone-600">
        It may have been deleted, or the owner may not have shared it with this profile yet.
      </p>
      <Link
        href="/documents"
        className="mt-7 inline-block rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800"
      >
        Return to my documents
      </Link>
    </main>
  );
}
