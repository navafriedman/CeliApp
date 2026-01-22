import Link from 'next/link';

const features = [
  {
    href: '/diary',
    icon: '📔',
    title: 'Food Diary',
    description: 'Track your meals and discover what works for you',
    color: 'bg-green-100 hover:bg-green-200 border-green-300',
  },
  {
    href: '/recipes',
    icon: '👩‍🍳',
    title: 'Recipe Box',
    description: 'Save and organize your favorite gluten-free recipes',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  },
  {
    href: '/restaurants',
    icon: '🍽️',
    title: 'Restaurant Tracker',
    description: 'Keep track of safe places to eat out',
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
  },
  {
    href: '/guide',
    icon: '📚',
    title: 'Gluten Guide',
    description: 'Quick reference for ingredients and hidden gluten',
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-amber-800 mb-4">
          Welcome to CeliApp
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your personal companion for navigating life with celiac disease.
          Track your journey, discover safe foods, and take control of your health.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className={`block p-6 rounded-xl border-2 transition-all transform hover:scale-102 ${feature.color}`}
          >
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {feature.title}
            </h2>
            <p className="text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-white rounded-xl border border-amber-200 shadow-sm">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">
          Getting Started
        </h3>
        <p className="text-gray-600">
          Start by adding entries to your Food Diary to track meals and how they make you feel.
          Over time, you&apos;ll build a personal database of safe foods and recipes that work for you.
        </p>
      </div>
    </div>
  );
}
