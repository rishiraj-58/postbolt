import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">PostBolt</h1>
          <p className="text-xl md:text-2xl mb-8">Your personal AI-powered tool to generate engaging LinkedIn and social media posts in seconds.</p>
          <Link 
            href="/login" 
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">✍️ AI-Powered Content</h3>
              <p className="text-gray-800">Generate professional LinkedIn posts with just a few clicks.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">📋 Save Your Posts</h3>
              <p className="text-gray-800">Easily save and manage your generated content.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">⚡ Fast & Easy</h3>
              <p className="text-gray-800">Clean interface designed for speed and efficiency.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to boost your social media presence?</h2>
          <Link 
            href="/sign-up" 
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
          >
            Sign Up For Free
          </Link>
        </div>
      </div>
    </main>
  );
}
