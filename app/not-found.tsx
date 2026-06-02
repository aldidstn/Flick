import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <section className="glass-panel max-w-md rounded-xl p-8 text-center">
        <p className="text-sm font-black uppercase text-graphite">Lost flick</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-duo">This jar is not here.</h1>
        <Link
          href="/"
          className="duo-button focus-ring mt-8 inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-black uppercase transition"
        >
          Back home
        </Link>
      </section>
    </main>
  );
}
