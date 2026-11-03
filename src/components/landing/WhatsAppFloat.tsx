import { MessageCircle } from 'lucide-react'

export function WhatsAppFloat() {
  const phone = '2349077100069'
  const text = encodeURIComponent(
    "Hello ARCHIMARTng, I'd like to know more about your platform.",
  )
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-2xl shadow-black/30 ring-2 ring-white/20 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
        <MessageCircle className="relative h-6 w-6" fill="currentColor" />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">
        Chat on WhatsApp
      </span>
    </a>
  )
}
