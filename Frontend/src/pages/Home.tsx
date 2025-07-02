import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { Works } from '../components/Works';
import { FaqSection } from '../components/FaqSection';
import { Footer } from '../components/Footer';
import { BackgroundElements } from '../components/BackgroundElements';

// Enhanced AI Features Section
import { Bot, Code2, Terminal, Search, FileText, Zap } from 'lucide-react';

const aiFeatures = [
  {
    icon: Bot,
    title: 'Smart AI Agents',
    description: '6 specialized AI agents for explaining, fixing, refactoring, testing, scaffolding, and running commands.',
    color: 'from-blue-500 to-purple-600'
  },
  {
    icon: Code2,
    title: 'Enhanced Code Editor',
    description: 'Monaco editor with floating AI actions, smart suggestions, and real-time code analysis.',
    color: 'from-green-500 to-teal-600'
  },
  {
    icon: Terminal,
    title: 'Smart Terminal',
    description: 'AI-powered terminal with command suggestions, safety checks, and natural language commands.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Search,
    title: 'Intelligent Search',
    description: 'Semantic search, fuzzy matching, and natural language queries across your codebase.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: FileText,
    title: 'Context Engine',
    description: 'Intelligent context building that understands your project structure and dependencies.',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    icon: Zap,
    title: 'Image to Code',
    description: 'OCR-powered image analysis that can extract code from screenshots and diagrams.',
    color: 'from-yellow-500 to-orange-600'
  }
];

export function Home() {
  const navigate = useNavigate();
  const { setPrompt } = useAppContext();
  const [userPrompt, setUserPrompt] = useState('');

  const handleBuildProject = () => {
    if (userPrompt.trim()) {
      setPrompt(userPrompt);
      navigate('/builder');
    }
  };

  const handleExampleClick = (example: string) => {
    setUserPrompt(example);
    setPrompt(example);
    navigate('/builder');
  };

  const examples = [
    "Build a modern React todo app with drag & drop functionality",
    "Create a dashboard with charts using Chart.js and dark mode",
    "Build a blog platform with markdown support and search",
    "Create a portfolio website with animations and responsive design",
    "Build an e-commerce product catalog with filtering",
    "Create a real-time chat application with WebSocket"
  ];

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      <BackgroundElements />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Enhanced Hero Section with AI Features */}
        <section className="relative py-20 px-4 text-center">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-6">
                AI-Powered
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Code Builder
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Build full-stack applications with advanced AI agents. From idea to deployment in minutes, 
                powered by intelligent code generation and smart assistance.
              </p>
            </div>

            {/* AI Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Enhanced Prompt Input */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">
                Describe your app and let AI build it
              </h2>
              
              <div className="relative mb-6">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., Build a modern todo app with drag & drop, dark mode, and local storage..."
                  className="w-full p-6 bg-gray-800/50 text-gray-200 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder-gray-500 text-lg leading-relaxed h-32"
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                  {userPrompt.length}/500
                </div>
              </div>

              <button
                onClick={handleBuildProject}
                disabled={!userPrompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-lg"
              >
                <span className="flex items-center justify-center gap-3">
                  <Bot className="w-5 h-5" />
                  Build with AI Agents
                </span>
              </button>
            </div>

            {/* Example Projects */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-white mb-6">Or try these examples:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-all duration-300 group"
                  >
                    <p className="text-gray-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                      {example}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Capabilities Showcase */}
        <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Powered by Advanced AI Agents
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Our intelligent agent system understands your code, provides smart suggestions, 
              and automates repetitive tasks so you can focus on building amazing apps.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Explainer Agent</h3>
                <p className="text-gray-400 leading-relaxed">
                  Analyzes your code patterns, explains complex logic, and provides detailed documentation with complexity assessments.
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Fixer Agent</h3>
                <p className="text-gray-400 leading-relaxed">
                  Detects bugs, security vulnerabilities, and performance issues. Provides automated fixes and best practice suggestions.
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Refactor Agent</h3>
                <p className="text-gray-400 leading-relaxed">
                  Optimizes code structure, improves readability, and suggests modern patterns while maintaining functionality.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FeaturesSection />
        <Works />
        <FaqSection />
        <Footer />
      </div>
    </div>
  );
}
