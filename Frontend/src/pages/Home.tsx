import {
  ArrowRight,
  Check,
  ChevronDown,
  Code,
  Cpu,
  Zap,
  FlaskConical,
  Bolt as BoltIcon,
  Layers,
  Globe,
  Sparkles,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disclosure } from '@headlessui/react';
import { cn } from '../utils/cn';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', {
        state: {
          prompt: prompt,
        },
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 min-h-screen relative">
      {/* Ambient background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-5 w-72 h-72 bg-blue-600/10 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
            <BoltIcon className="w-6 h-6 text-white relative z-10" />
          </div>
          <span className="text-2xl font-bold text-white">Bolt</span>
        </div>
        <div className="flex items-center space-x-6">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Features
          </a>
          <a
            href="#why-choose"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Why Choose
          </a>
          <a
            href="#faq"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            FAQ
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 px-6 py-24 md:py-32 lg:py-40">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-5xl font-bold text-white leading-tight">
              Transform Ideas into Websites
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Powered by AI
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simply describe, create, and customize your website in seconds
              with
              <span className="text-blue-400 font-semibold"> Bolt</span>
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="mt-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="backdrop-blur-md bg-gray-900/50 rounded-xl shadow-2xl border border-gray-800/80 overflow-hidden">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the website you want to build..."
                className="w-full h-32 p-5 bg-transparent text-gray-100 rounded-lg focus:outline-none resize-none placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="p-3">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-blue-600/50 text-white py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <span>Generate Website</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Your Toolkit for Modern Web Development
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Everything you need to build, test, and deploy web applications
                in minutes.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FlaskConical className="w-8 h-8 text-blue-400" />,
                title: 'AI-Powered Generation',
                description:
                  'Describe your website in natural language and watch as Bolt generates all the code and assets for you.',
              },
              {
                icon: <Code className="w-8 h-8 text-blue-400" />,
                title: 'Interactive Editor',
                description:
                  'Make precise adjustments with our fully-featured code editor with syntax highlighting and autocompletion.',
              },
              {
                icon: <Zap className="w-8 h-8 text-blue-400" />,
                title: 'Instant Preview',
                description:
                  'See changes in real-time with our built-in preview that updates as you modify your application.',
              },
              {
                icon: <Cpu className="w-8 h-8 text-blue-400" />,
                title: 'WebContainer Technology',
                description:
                  'Run your web applications directly in the browser with our cutting-edge WebContainer technology.',
              },
              {
                icon: <Layers className="w-8 h-8 text-blue-400" />,
                title: 'Step-by-Step Guidance',
                description:
                  'Follow our intuitive step-by-step process to bring your web application from concept to completion.',
              },
              {
                icon: <Globe className="w-8 h-8 text-blue-400" />,
                title: 'One-Click Deployment',
                description:
                  'Deploy your application to the web with a single click and share it with the world.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm border border-gray-800 rounded-xl p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-3 bg-blue-500/10 rounded-lg inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="why-choose" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose Bolt?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                The smartest way to transform your ideas into fully functional
                web applications.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm border border-gray-800 rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">
                For Developers
              </h3>
              <ul className="space-y-4">
                {[
                  'Accelerate development workflows',
                  'Focus on creative problem-solving',
                  'Automate repetitive tasks',
                  'Experiment with new ideas quickly',
                  'Learn from AI-generated code',
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-gray-900 to-gray-950 backdrop-blur-sm border border-gray-800 rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">
                For Non-Technical Users
              </h3>
              <ul className="space-y-4">
                {[
                  'Build websites without coding knowledge',
                  'Translate ideas into functional prototypes',
                  'Save money on development costs',
                  'Iterate quickly on feedback',
                  'Maintain control over your projects',
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-300">
                Find answers to common questions about Bolt.
              </p>
            </motion.div>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'How does Bolt turn my prompts into a website?',
                answer:
                  'Bolt uses advanced AI to interpret your natural language description and generate the necessary code to create a fully functional website. It analyzes your requirements and produces HTML, CSS, and JavaScript files that match your vision.',
              },
              {
                question: 'Can I customize the generated website?',
                answer:
                  'Absolutely! Bolt provides a full-featured code editor where you can make precise adjustments to any aspect of your website. The changes are reflected in real-time in the preview window.',
              },
              {
                question: 'What kind of websites can I create with Bolt?',
                answer:
                  "Bolt can help you create a wide range of websites, from simple landing pages to complex web applications with dynamic functionality. It's suitable for portfolios, blogs, e-commerce sites, dashboards, and more.",
              },
              {
                question: 'Do I need coding experience to use Bolt?',
                answer:
                  'No coding experience is required. Bolt is designed to be accessible to everyone, regardless of technical background. However, if you do have coding experience, you can leverage it to make more advanced customizations.',
              },
              {
                question: 'How do I deploy my website?',
                answer:
                  'Bolt offers a one-click deployment feature that allows you to publish your website to the internet instantly. You can also export your project files to deploy through other hosting services.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="border border-gray-800 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Disclosure>
                  {({ open }) => (
                    <div>
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-left text-white bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <span className="text-lg font-medium">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={cn(
                            'w-5 h-5 text-blue-400 transition-transform',
                            open ? 'transform rotate-180' : ''
                          )}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-6 py-4 bg-gray-900/30 backdrop-blur-sm text-gray-300">
                        {faq.answer}
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"></div>
                <BoltIcon className="w-6 h-6 text-white relative z-10" />
              </div>
              <span className="text-2xl font-bold text-white">Bolt</span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <a
                href="#features"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#why-choose"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Why Choose
              </a>
              <a
                href="#faq"
                className="text-gray-400 hover:text-white transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 Bolt. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="https://x.com/Pankajkumar_dev" target='_blank' className="text-gray-400 hover:text-white">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="https://github.com/PankajKumardev/Bolt-Clone" target='_blank' className="text-gray-400 hover:text-white">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
