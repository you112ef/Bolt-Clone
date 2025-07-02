// Language-aware AI configuration for different programming languages
export interface LanguageConfig {
  id: string;
  name: string;
  extensions: string[];
  monacoLanguage: string;
  aiModel: 'gpt-4' | 'claude' | 'gemini-vision' | 'gpt-4o' | 'mistral';
  actions: LanguageAction[];
  execution: ExecutionConfig;
  patterns: CodePattern[];
  templates: CodeTemplate[];
}

export interface LanguageAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  prompt: string;
  shortcut?: string;
}

export interface ExecutionConfig {
  enabled: boolean;
  command: string;
  runtime: string;
  extensions: string[];
  flags?: string[];
  env?: Record<string, string>;
}

export interface CodePattern {
  name: string;
  regex: RegExp;
  description: string;
}

export interface CodeTemplate {
  name: string;
  description: string;
  code: string;
  variables?: string[];
}

// Main language configuration map
export const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  // Python - GPT-4 optimized
  python: {
    id: 'python',
    name: 'Python',
    extensions: ['py', 'pyw', 'pyc', 'pyo', 'pyd', 'ipynb'],
    monacoLanguage: 'python',
    aiModel: 'gpt-4',
    actions: [
      {
        id: 'add_tests',
        label: 'Add Tests',
        icon: '🧪',
        description: 'Generate pytest unit tests',
        prompt: 'Generate comprehensive pytest unit tests for this Python code with proper fixtures and edge cases.'
      },
      {
        id: 'optimize_performance',
        label: 'Optimize',
        icon: '⚡',
        description: 'Optimize Python performance',
        prompt: 'Optimize this Python code for better performance using best practices, vectorization, and efficient algorithms.'
      },
      {
        id: 'add_type_hints',
        label: 'Type Hints',
        icon: '🏷️',
        description: 'Add Python type hints',
        prompt: 'Add comprehensive type hints to this Python code following PEP 484 standards.'
      },
      {
        id: 'create_docstrings',
        label: 'Docstrings',
        icon: '📝',
        description: 'Generate documentation',
        prompt: 'Add comprehensive docstrings following Google/NumPy style to this Python code.'
      }
    ],
    execution: {
      enabled: true,
      command: 'python3',
      runtime: 'python',
      extensions: ['py'],
      flags: ['-u'],
      env: { 'PYTHONPATH': '.' }
    },
    patterns: [
      { name: 'function', regex: /def\s+(\w+)\s*\([^)]*\):/g, description: 'Python function definition' },
      { name: 'class', regex: /class\s+(\w+)(?:\([^)]*\))?:/g, description: 'Python class definition' },
      { name: 'import', regex: /(?:from\s+[\w.]+\s+)?import\s+[\w.,\s]+/g, description: 'Python import statement' }
    ],
    templates: [
      {
        name: 'Flask API',
        description: 'Basic Flask REST API',
        code: `from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/{{resource}}', methods=['GET'])
def get_{{resource}}():
    return jsonify({"message": "Hello from {{resource}}"})

if __name__ == '__main__':
    app.run(debug=True)`,
        variables: ['resource']
      }
    ]
  },

  // JavaScript/TypeScript - GPT-4o optimized
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    monacoLanguage: 'javascript',
    aiModel: 'gpt-4o',
    actions: [
      {
        id: 'convert_to_typescript',
        label: 'To TypeScript',
        icon: '🔷',
        description: 'Convert to TypeScript',
        prompt: 'Convert this JavaScript code to TypeScript with proper type definitions and interfaces.'
      },
      {
        id: 'add_error_handling',
        label: 'Error Handling',
        icon: '🛡️',
        description: 'Add comprehensive error handling',
        prompt: 'Add robust error handling with try-catch blocks and proper error messages to this JavaScript code.'
      },
      {
        id: 'optimize_async',
        label: 'Async Optimize',
        icon: '⏱️',
        description: 'Optimize async operations',
        prompt: 'Optimize async operations in this JavaScript code using Promise.all, proper error handling, and performance best practices.'
      }
    ],
    execution: {
      enabled: true,
      command: 'node',
      runtime: 'nodejs',
      extensions: ['js', 'mjs'],
      flags: ['--experimental-modules']
    },
    patterns: [
      { name: 'function', regex: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\()/g, description: 'JavaScript function' },
      { name: 'class', regex: /class\s+(\w+)(?:\s+extends\s+\w+)?/g, description: 'JavaScript class' },
      { name: 'import', regex: /import\s+.*\s+from\s+['"`][^'"`]+['"`]/g, description: 'ES6 import' }
    ],
    templates: [
      {
        name: 'Express API',
        description: 'Express.js REST API endpoint',
        code: `const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/{{endpoint}}', (req, res) => {
  res.json({ message: 'Hello from {{endpoint}}' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
        variables: ['endpoint']
      }
    ]
  },

  // TypeScript - GPT-4o optimized
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts', 'tsx', 'd.ts'],
    monacoLanguage: 'typescript',
    aiModel: 'gpt-4o',
    actions: [
      {
        id: 'generate_interfaces',
        label: 'Generate Types',
        icon: '🏗️',
        description: 'Generate TypeScript interfaces',
        prompt: 'Generate comprehensive TypeScript interfaces and types for this code with proper generic constraints.'
      },
      {
        id: 'add_decorators',
        label: 'Add Decorators',
        icon: '🎨',
        description: 'Add TypeScript decorators',
        prompt: 'Add appropriate TypeScript decorators for dependency injection, validation, or framework integration.'
      }
    ],
    execution: {
      enabled: true,
      command: 'npx ts-node',
      runtime: 'typescript',
      extensions: ['ts'],
      flags: ['--transpile-only']
    },
    patterns: [
      { name: 'interface', regex: /interface\s+(\w+)(?:<[^>]*>)?\s*{/g, description: 'TypeScript interface' },
      { name: 'type', regex: /type\s+(\w+)(?:<[^>]*>)?\s*=/g, description: 'TypeScript type alias' }
    ],
    templates: [
      {
        name: 'React Component',
        description: 'TypeScript React component',
        code: `import React from 'react';

interface {{ComponentName}}Props {
  // Add props here
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = () => {
  return (
    <div>
      <h1>{{ComponentName}}</h1>
    </div>
  );
};

export default {{ComponentName}};`,
        variables: ['ComponentName']
      }
    ]
  },

  // Bash/Shell - Claude optimized
  bash: {
    id: 'bash',
    name: 'Bash',
    extensions: ['sh', 'bash', 'zsh', 'fish'],
    monacoLanguage: 'shell',
    aiModel: 'claude',
    actions: [
      {
        id: 'add_error_checks',
        label: 'Error Checks',
        icon: '✅',
        description: 'Add error checking',
        prompt: 'Add comprehensive error checking, exit codes, and safety measures to this bash script.'
      },
      {
        id: 'optimize_performance',
        label: 'Optimize',
        icon: '🚀',
        description: 'Optimize shell script',
        prompt: 'Optimize this shell script for better performance, portability, and POSIX compliance.'
      }
    ],
    execution: {
      enabled: true,
      command: 'bash',
      runtime: 'shell',
      extensions: ['sh', 'bash'],
      flags: ['-e', '-u']
    },
    patterns: [
      { name: 'function', regex: /^\s*(\w+)\s*\(\)\s*{/gm, description: 'Bash function' },
      { name: 'variable', regex: /^\s*(\w+)=/gm, description: 'Variable assignment' }
    ],
    templates: [
      {
        name: 'Deployment Script',
        description: 'Basic deployment script',
        code: `#!/bin/bash
set -euo pipefail

# {{ScriptName}} - {{Description}}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

main() {
    log "Starting {{ScriptName}}"
    # Add your deployment logic here
    log "{{ScriptName}} completed successfully"
}

main "$@"`,
        variables: ['ScriptName', 'Description']
      }
    ]
  },

  // SQL - Mistral optimized
  sql: {
    id: 'sql',
    name: 'SQL',
    extensions: ['sql', 'ddl', 'dml'],
    monacoLanguage: 'sql',
    aiModel: 'mistral',
    actions: [
      {
        id: 'optimize_query',
        label: 'Optimize Query',
        icon: '⚡',
        description: 'Optimize SQL performance',
        prompt: 'Optimize this SQL query for better performance with proper indexing suggestions and query restructuring.'
      },
      {
        id: 'add_indexes',
        label: 'Add Indexes',
        icon: '🔍',
        description: 'Suggest database indexes',
        prompt: 'Analyze this SQL and suggest appropriate database indexes for optimal performance.'
      }
    ],
    execution: {
      enabled: false,
      command: 'sqlite3',
      runtime: 'sql',
      extensions: ['sql']
    },
    patterns: [
      { name: 'select', regex: /SELECT\s+.*\s+FROM\s+\w+/gi, description: 'SELECT statement' },
      { name: 'table', regex: /(?:CREATE\s+TABLE|FROM|JOIN)\s+(\w+)/gi, description: 'Table reference' }
    ],
    templates: []
  },

  // HTML/CSS - Gemini Vision optimized
  html: {
    id: 'html',
    name: 'HTML',
    extensions: ['html', 'htm', 'xhtml'],
    monacoLanguage: 'html',
    aiModel: 'gemini-vision',
    actions: [
      {
        id: 'improve_accessibility',
        label: 'Accessibility',
        icon: '♿',
        description: 'Improve accessibility',
        prompt: 'Improve the accessibility of this HTML with proper ARIA labels, semantic elements, and WCAG compliance.'
      },
      {
        id: 'optimize_seo',
        label: 'SEO Optimize',
        icon: '🔍',
        description: 'Optimize for SEO',
        prompt: 'Optimize this HTML for SEO with proper meta tags, structured data, and semantic markup.'
      }
    ],
    execution: {
      enabled: false,
      command: '',
      runtime: 'browser',
      extensions: ['html']
    },
    patterns: [
      { name: 'element', regex: /<(\w+)(?:\s[^>]*)?>.*?<\/\1>/g, description: 'HTML element' },
      { name: 'id', regex: /id=["']([^"']+)["']/g, description: 'Element ID' }
    ],
    templates: [
      {
        name: 'HTML5 Page',
        description: 'Basic HTML5 page structure',
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PageTitle}}</title>
</head>
<body>
    <header>
        <h1>{{PageTitle}}</h1>
    </header>
    
    <main>
        <!-- Your content here -->
    </main>
    
    <footer>
        <!-- Footer content -->
    </footer>
</body>
</html>`,
        variables: ['PageTitle']
      }
    ]
  },

  // CSS - Gemini Vision optimized
  css: {
    id: 'css',
    name: 'CSS',
    extensions: ['css', 'scss', 'sass', 'less'],
    monacoLanguage: 'css',
    aiModel: 'gemini-vision',
    actions: [
      {
        id: 'improve_responsive',
        label: 'Responsive',
        icon: '📱',
        description: 'Improve responsive design',
        prompt: 'Make this CSS fully responsive with proper breakpoints, flexible layouts, and mobile-first approach.'
      },
      {
        id: 'optimize_performance',
        label: 'Optimize',
        icon: '⚡',
        description: 'Optimize CSS performance',
        prompt: 'Optimize this CSS for better performance by reducing specificity, eliminating unused styles, and improving loading speed.'
      }
    ],
    execution: {
      enabled: false,
      command: '',
      runtime: 'browser',
      extensions: ['css']
    },
    patterns: [
      { name: 'selector', regex: /([.#]?[\w-]+(?:\s*[>+~]\s*[\w-]+)*)\s*{/g, description: 'CSS selector' },
      { name: 'property', regex: /([\w-]+)\s*:\s*([^;]+);/g, description: 'CSS property' }
    ],
    templates: []
  },

  // Docker - Claude optimized
  dockerfile: {
    id: 'dockerfile',
    name: 'Docker',
    extensions: ['dockerfile', 'Dockerfile'],
    monacoLanguage: 'dockerfile',
    aiModel: 'claude',
    actions: [
      {
        id: 'optimize_layers',
        label: 'Optimize Layers',
        icon: '🏗️',
        description: 'Optimize Docker layers',
        prompt: 'Optimize this Dockerfile for smaller image size, better caching, and security best practices.'
      },
      {
        id: 'add_security',
        label: 'Security',
        icon: '🔒',
        description: 'Improve security',
        prompt: 'Add security best practices to this Dockerfile including non-root user, minimal base image, and vulnerability scanning.'
      }
    ],
    execution: {
      enabled: true,
      command: 'docker build',
      runtime: 'docker',
      extensions: ['dockerfile'],
      flags: ['-t', 'app:latest', '.']
    },
    patterns: [
      { name: 'instruction', regex: /^(FROM|RUN|COPY|ADD|EXPOSE|CMD|ENTRYPOINT)\s+(.+)$/gm, description: 'Docker instruction' }
    ],
    templates: []
  }
};

// Helper functions
export function getLanguageByExtension(extension: string): LanguageConfig | null {
  const normalizedExt = extension.toLowerCase().replace(/^\./, '');
  
  for (const config of Object.values(LANGUAGE_MAP)) {
    if (config.extensions.includes(normalizedExt)) {
      return config;
    }
  }
  
  return null;
}

export function getLanguageByFilename(filename: string): LanguageConfig | null {
  const extension = filename.split('.').pop();
  if (!extension) return null;
  
  return getLanguageByExtension(extension);
}

export function getAllSupportedExtensions(): string[] {
  const extensions = new Set<string>();
  
  Object.values(LANGUAGE_MAP).forEach(config => {
    config.extensions.forEach(ext => extensions.add(ext));
  });
  
  return Array.from(extensions);
}

export function getAvailableActions(languageId: string): LanguageAction[] {
  const config = LANGUAGE_MAP[languageId];
  return config ? config.actions : [];
}

export function canExecuteLanguage(languageId: string): boolean {
  const config = LANGUAGE_MAP[languageId];
  return config ? config.execution.enabled : false;
}

// Default fallback configuration
export const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  id: 'text',
  name: 'Plain Text',
  extensions: ['txt', 'md', 'rst'],
  monacoLanguage: 'plaintext',
  aiModel: 'gpt-4o',
  actions: [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: '📄',
      description: 'Summarize content',
      prompt: 'Summarize this text content in a clear and concise manner.'
    }
  ],
  execution: {
    enabled: false,
    command: '',
    runtime: 'none',
    extensions: []
  },
  patterns: [],
  templates: []
};