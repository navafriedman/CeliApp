import Link from 'next/link';

const features = [
  {
    href: '/diary',
    icon: '📔',
    title: 'Food Diary',
    description: 'Track your meals and discover what works for you',
    gradient: 'from-teal-400 to-emerald-400',
    bgGlow: 'bg-teal-500/20',
    iconBg: 'bg-teal-100',
    hoverText: 'text-teal-600',
  },
  {
    href: '/recipes',
    icon: '👩‍🍳',
    title: 'Recipe Box',
    description: 'Save and organize your favorite gluten-free recipes',
    gradient: 'from-pink-400 to-rose-400',
    bgGlow: 'bg-pink-500/20',
    iconBg: 'bg-pink-100',
    hoverText: 'text-pink-600',
  },
  {
    href: '/restaurants',
    icon: '🍽️',
    title: 'Restaurant Tracker',
    description: 'Keep track of safe places to eat out',
    gradient: 'from-violet-400 to-purple-400',
    bgGlow: 'bg-violet-500/20',
    iconBg: 'bg-violet-100',
    hoverText: 'text-violet-600',
  },
  {
    href: '/guide',
    icon: '📚',
    title: 'Gluten Guide',
    description: 'Quick reference for ingredients and hidden gluten',
    gradient: 'from-amber-400 to-orange-400',
    bgGlow: 'bg-amber-500/20',
    iconBg: 'bg-amber-100',
    hoverText: 'text-amber-600',
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="relative text-center mb-16 py-8">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-10 w-32 h-32 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-violet-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-teal-300/30 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-block mb-4">
            <span className="text-5xl float">✨</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">CeliApp</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your playful companion for living your{' '}
            <span className="font-semibold text-violet-600">best gluten-free life</span>
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/diary" className="badge-teal px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Track Meals
            </Link>
            <Link href="/recipes" className="badge-pink px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Find Recipes
            </Link>
            <Link href="/restaurants" className="badge-purple px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Discover Restaurants
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="card-pop group relative block p-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Glow effect on hover - positioned behind content */}
            <div className={`absolute inset-0 ${feature.bgGlow} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

            <div className="relative z-10">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.iconBg} rounded-2xl mb-4`}>
                <span className="text-4xl wiggle">{feature.icon}</span>
              </div>

              {/* Content */}
              <h2 className={`text-2xl font-bold text-gray-800 mb-2 group-hover:${feature.hoverText} transition-colors`}>
                {feature.title}
              </h2>
              <p className="text-gray-500 leading-relaxed">
                {feature.description}
              </p>

              {/* Arrow indicator */}
              <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                <span>Get started</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Getting Started Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 rounded-3xl p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl bounce-gentle">✨</div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">
              Ready to start your journey?
            </h3>
            <p className="text-white/90 leading-relaxed">
              Begin by tracking your meals in the Food Diary. Over time, you&apos;ll build a personal
              database of foods that make you feel amazing!
            </p>
          </div>
          <Link
            href="/diary"
            className="flex-shrink-0 bg-white text-violet-600 px-6 py-3 rounded-full font-bold hover:bg-violet-50 transition-colors shadow-lg"
          >
            Start Tracking →
          </Link>
        </div>
      </div>

      {/* Fun stats or tips could go here */}
      <div className="mt-12 grid grid-cols-3 gap-4 text-center">
        <div className="p-4">
          <div className="text-3xl mb-2">🥗</div>
          <p className="text-sm text-gray-500">Track your meals</p>
        </div>
        <div className="p-4">
          <div className="text-3xl mb-2">💪</div>
          <p className="text-sm text-gray-500">Feel your best</p>
        </div>
        <div className="p-4">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm text-gray-500">Live gluten-free</p>
        </div>
      </div>
    </div>
  );
}
