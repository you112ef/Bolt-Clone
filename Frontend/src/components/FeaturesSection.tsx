import { Cpu, Code, Zap, FlaskConical, Layers, Globe } from 'lucide-react';
import React from 'react';

export function FeaturesSection() {
  const features = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'AI-Powered Generation',
      description:
        'Describe your website in natural language and watch as Bolt generates all the code and assets for you.',
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Interactive Editor',
      description:
        'Make precise adjustments with our fully-featured code editor with syntax highlighting and autocompletion.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Preview',
      description:
        'See changes in real-time with our built-in preview that updates as you modify your application.',
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      title: 'WebContainer Technology',
      description:
        'Run your web applications directly in the browser with our cutting-edge WebContainer technology.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Step-by-Step Guidance',
      description:
        'Follow our intuitive step-by-step process to bring your web application from concept to completion.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'One-Click Deployment',
      description:
        'Deploy your application to the web with a single click and share it with the world.',
    },
  ];

  return (
    <section id="features" className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl text-center text-white font-medium">
          Why Choose Bolt for Creating Website?
        </h2>
        <p className="text-base text-center mt-4 max-w-lg mx-auto text-gray-400">
          Bolt offers a powerful suite of features to make web development
          and deployment effortless.
        </p>
        <div className="text-center text-3xl text-white font-medium mt-20">
          Powerful Features!
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-8 text-center px-4 sm:px-0 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="width-fit text-left md:ml-7 border border-gray-800 rounded-lg p-4 ">
              <div className="flex items-center gap-2">
              <div className="mb-2 w-fit rounded-lg p-1 text-center text-blue-400"> 
                {feature.icon}
              </div>
              <div className="text-md mb-1 font-normal text-gray-900 dark:text-gray-100">
                {feature.title}
              </div>
              </div>
              <div className="font-regular max-w-sm text-xs text-gray-600 dark:text-gray-400">
              {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 