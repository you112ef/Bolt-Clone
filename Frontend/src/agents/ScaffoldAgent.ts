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
          instructions: scaffold.instructions
        },
        [
          'Review the generated structure before creating files',
          'Install dependencies after creating the project',
          'Follow the setup instructions for best results'
        ]
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
  } {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('react')) {
      return this.createReactProject(description);
    } else if (lowerDesc.includes('component')) {
      return this.createComponentScaffold(description);
    }

    return this.createSimpleProject(description);
  }

  private createReactProject(description: string): any {
    const projectName = this.extractProjectName(description) || 'react-app';
    
    return {
      structure: ['src/', 'src/components/', 'public/'],
      files: [
        {
          path: 'src/App.tsx',
          content: this.generateReactApp(projectName),
          description: 'Main App component'
        }
      ],
      instructions: ['Run npm install', 'Run npm start']
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
        }
      ],
      instructions: [`Import and use ${componentName} in your app`]
    };
  }

  private createSimpleProject(description: string): any {
    const projectName = this.extractProjectName(description) || 'simple-project';
    
    return {
      structure: ['src/'],
      files: [
        {
          path: 'src/index.js',
          content: 'console.log("Hello World!");',
          description: 'Main entry point'
        }
      ],
      instructions: ['Edit src/index.js to add your code']
    };
  }

  private extractProjectName(description: string): string | null {
    const matches = description.match(/(?:create|build|make)\s+(?:a\s+)?(\w+)/i);
    return matches?.[1]?.toLowerCase() || null;
  }

  private extractComponentName(description: string): string | null {
    const matches = description.match(/(?:create|build|make)\s+(?:a\s+)?(\w+)(?:\s+component)?/i);
    return matches?.[1] || null;
  }

  private generateReactApp(projectName: string): string {
    return `import React from 'react';

function App() {
  return (
    <div>
      <h1>Welcome to ${projectName}</h1>
      <p>Start editing to see your changes!</p>
    </div>
  );
}

export default App;`;
  }

  private generateReactComponent(name: string): string {
    return `import React from 'react';

interface ${name}Props {
  // Add props here
}

const ${name}: React.FC<${name}Props> = () => {
  return (
    <div>
      <h2>${name} Component</h2>
      <p>Edit this component to customize it.</p>
    </div>
  );
};

export default ${name};`;
  }
}