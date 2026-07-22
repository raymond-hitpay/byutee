import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Byutee
        </span>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-8 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span>✨</span>
          <span>Beauty & Wellness, Simplified</span>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          Run Your Beauty Business{' '}
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Effortlessly
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Byutee gives beauty and wellness professionals the tools to manage bookings, accept payments, and grow their clientele — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 px-8 py-6 text-lg"
            >
              Get Started Free
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📅',
              title: 'Smart Bookings',
              description: 'Let clients book appointments online 24/7. Automated confirmations keep everyone in sync.',
            },
            {
              icon: '💳',
              title: 'Seamless Payments',
              description: 'Accept payments via QR, cards, and more with HitPay. Get paid instantly.',
            },
            {
              icon: '💅',
              title: 'Service Management',
              description: 'List your services, set durations and pricing. Update anytime with ease.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-pink-100 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Byutee. All rights reserved.</p>
      </footer>
    </main>
  );
}
