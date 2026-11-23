'use client'

export default function MarketplaceAccountsError({
  reset,
}: {
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">
          Marketplace accounts are unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again. No account status was changed by this page load.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
