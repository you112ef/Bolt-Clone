import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class ScaffoldAgent extends BaseAgent {
  type: AgentType = 'scaffold';
  name = 'Project Scaffolder';
  description = 'Creates project structures, files, and boilerplate code';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'scaffold' && !!request.input;
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const projectDescription = request.input;

      if (!projectDescription) {
        return this.createErrorResponse(
          'No project description provided',
          ['Describe what you want to create', 'Example: "Create a React todo app"']
        );
      }

      const scaffold = this.generateScaffold(projectDescription);

      return this.createSuccessResponse(
        {
          projectStructure: scaffold.structure,
          files: scaffold.files,
          instructions: scaffold.instructions,
          dependencies: scaffold.dependencies,
          scripts: scaffold.scripts
        },
        [
          'Review the generated structure before creating files',
          'Install dependencies after creating the project',
          'Follow the setup instructions for best results'
        ],
        scaffold.files.map(file => ({
          type: 'create_file',
          payload: { path: file.path, content: file.content },
          description: `Create ${file.path}`
        }))
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to generate scaffold: ${error}`,
        ['Try with a more specific description', 'Specify the technology stack']
      );
    }
  }

  private generateScaffold(description: string): {
    structure: string[];
    files: Array<{ path: string; content: string; description: string }>;
    instructions: string[];
    dependencies: string[];
    scripts: Record<string, string>;
  } {
    const lowerDesc = description.toLowerCase();
    
    // Detect project type
    if (lowerDesc.includes('react')) {
      return this.createReactProject(description);
    } else if (lowerDesc.includes('vue')) {
      return this.createVueProject(description);
    } else if (lowerDesc.includes('express') || lowerDesc.includes('node')) {
      return this.createNodeProject(description);
    } else if (lowerDesc.includes('python') || lowerDesc.includes('flask') || lowerDesc.includes('django')) {
      return this.createPythonProject(description);
    } else if (lowerDesc.includes('component')) {
      return this.createComponentScaffold(description);
    }

    // Default: Simple JavaScript project
    return this.createSimpleProject(description);
  }

  private createReactProject(description: string): any {
    const projectName = this.extractProjectName(description) || 'react-app';
    
    return {
      structure: [
        'src/',
        'src/components/',
        'src/hooks/',
        'src/services/',
        'src/utils/',
        'src/styles/',
        'public/',
        'tests/'
      ],
      files: [
        {
          path: 'package.json',
          content: this.generatePackageJson(projectName, 'react'),
          description: 'Package configuration'
        },
        {
          path: 'src/App.tsx',
          content: this.generateReactApp(projectName),
          description: 'Main App component'
        },
        {
          path: 'src/index.tsx',
          content: this.generateReactIndex(),
          description: 'Application entry point'
        },
        {
          path: 'src/App.css',
          content: this.generateBasicCSS(),
          description: 'Application styles'
        },
        {
          path: 'public/index.html',
          content: this.generateIndexHTML(projectName),
          description: 'HTML template'
        }
      ],
      instructions: [
        'Run `npm install` to install dependencies',
        'Run `npm start` to start the development server',
        'Edit src/App.tsx to customize your application',
        'Add components in the src/components/ directory'
      ],
      dependencies: [
        'react', 'react-dom', 'typescript', '@types/react', '@types/react-dom'
      ],
      scripts: {
        'start': 'react-scripts start',
        'build': 'react-scripts build',
        'test': 'react-scripts test',
        'eject': 'react-scripts eject'
      }
    };
  }

  private createNodeProject(description: string): any {
    const projectName = this.extractProjectName(description) || 'node-app';
    
    return {
      structure: [
        'src/',
        'src/routes/',
        'src/middleware/',
        'src/models/',
        'src/controllers/',
        'tests/',
        'config/'
      ],
      files: [
        {
          path: 'package.json',
          content: this.generatePackageJson(projectName, 'node'),
          description: 'Package configuration'
        },
        {
          path: 'src/server.ts',
          content: this.generateExpressServer(),
          description: 'Express server setup'
        },
        {
          path: 'src/routes/index.ts',
          content: this.generateExpressRoutes(),
          description: 'API routes'
        },
        {
          path: '.env.example',
          content: this.generateEnvExample(),
          description: 'Environment variables template'
        }
      ],
      instructions: [
        'Run `npm install` to install dependencies',
        'Copy .env.example to .env and configure',
        'Run `npm run dev` to start development server',
        'API will be available at http://localhost:3000'
      ],
      dependencies: [
        'express', 'cors', 'dotenv', 'typescript', '@types/express', '@types/node'
      ],
      scripts: {
        'dev': 'nodemon src/server.ts',
        'build': 'tsc',
        'start': 'node dist/server.js'
      }
    };
  }

  private createComponentScaffold(description: string): any {
    const componentName = this.extractComponentName(description) || 'MyComponent';
    
    return {
      structure: [`src/components/${componentName}/`],
      files: [
        {
          path: `src/components/${componentName}/index.tsx`,
          content: this.generateReactComponent(componentName),
          description: `${componentName} component`
        },
        {
          path: `src/components/${componentName}/${componentName}.module.css`,
          content: this.generateComponentCSS(componentName),
          description: 'Component styles'
        },
        {
          path: `src/components/${componentName}/${componentName}.test.tsx`,
          content: this.generateComponentTest(componentName),
          description: 'Component tests'
        }
      ],
      instructions: [
        `Import and use ${componentName} in your app`,
        'Customize props and styling as needed',
        'Run tests to verify functionality'
      ],
      dependencies: [],
      scripts: {}
    };
  }

  private createSimpleProject(description: string): any {
    const projectName = this.extractProjectName(description) || 'simple-project';
    
    return {
      structure: ['src/', 'dist/', 'tests/'],
      files: [
        {
          path: 'package.json',
          content: this.generatePackageJson(projectName, 'simple'),
          description: 'Package configuration'
        },
        {
          path: 'src/index.js',
          content: this.generateSimpleIndex(),
          description: 'Main entry point'
        },
        {
          path: 'README.md',
          content: this.generateReadme(projectName),
          description: 'Project documentation'
        }
      ],
      instructions: [
        'Run `npm install` to install dependencies',
        'Edit src/index.js to add your code',
        'Run `npm start` to execute the application'
      ],
      dependencies: [],
      scripts: {
        'start': 'node src/index.js'
      }
    };
  }

  private createVueProject(description: string): any {
    // Simplified Vue project scaffold
    return this.createSimpleProject(description);
  }

  private createPythonProject(description: string): any {
    // Simplified Python project scaffold
    return this.createSimpleProject(description);
  }

  private extractProjectName(description: string): string | null {
    const matches = description.match(/(?:create|build|make)\s+(?:a\s+)?(\w+(?:\s+\w+)*?)(?:\s+app|\s+project|\s+application)?/i);
    return matches?.[1]?.replace(/\s+/g, '-').toLowerCase() || null;
  }

  private extractComponentName(description: string): string | null {
    const matches = description.match(/(?:create|build|make)\s+(?:a\s+)?(\w+)(?:\s+component)?/i);
    return matches?.[1] || null;
  }

  private generatePackageJson(name: string, type: string): string {
    const basePackage = {
      name,
      version: '1.0.0',
      description: '',
      main: type === 'react' ? 'src/index.tsx' : 'src/index.js',
      scripts: type === 'react' ? {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      } : {
        start: 'node src/index.js'
      }
    };

    return JSON.stringify(basePackage, null, 2);
  }

  private generateReactApp(projectName: string): string {
    return `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectName}</h1>
        <p>Start editing to see your changes!</p>
      </header>
    </div>
  );
}

export default App;`;
  }

  private generateReactIndex(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  }

  private generateBasicCSS(): string {
    return `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}`;
  }

  private generateIndexHTML(projectName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }

  private generateExpressServer(): string {
    return `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
  }

  private generateExpressRoutes(): string {
    return `import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;`;
  }

  private generateEnvExample(): string {
    return `PORT=3000
NODE_ENV=development
# Add your environment variables here`;
  }

  private generateReactComponent(name: string): string {
    return `import React from 'react';
import styles from './${name}.module.css';

interface ${name}Props {
  // Add props here
}

const ${name}: React.FC<${name}Props> = () => {
  return (
    <div className={styles.container}>
      <h2>${name} Component</h2>
      <p>Edit this component to customize it.</p>
    </div>
  );
};

export default ${name};`;
  }

  private generateComponentCSS(name: string): string {
    return `.container {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}`;
  }

  private generateComponentTest(name: string): string {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${name} from './index';

describe('${name}', () => {
  test('renders component', () => {
    render(<${name} />);
    expect(screen.getByText('${name} Component')).toBeInTheDocument();
  });
});`;
  }

  private generateSimpleIndex(): string {
    return `console.log('Hello World!');

// Add your code here`;
  }

  private generateReadme(projectName: string): string {
    return `# ${projectName}

## Description
A simple JavaScript project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`
`;
  }
}