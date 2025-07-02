import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class CommandRunnerAgent extends BaseAgent {
  type: AgentType = 'command';
  name = 'Command Runner';
  description = 'Executes terminal commands and provides command suggestions';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'command' && !!request.input;
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const command = request.input.trim();

      if (!command) {
        return this.createErrorResponse(
          'No command provided',
          ['Provide a command to execute', 'Example: "npm install"']
        );
      }

      // For security, we'll only suggest commands, not execute them directly
      const analysis = this.analyzeCommand(command);

      return this.createSuccessResponse(
        {
          command,
          analysis: analysis.analysis,
          suggestions: analysis.suggestions,
          safeToRun: analysis.safe,
          alternatives: analysis.alternatives
        },
        [
          'Review the command before execution',
          'Make sure you understand what the command does',
          'Check if all dependencies are installed'
        ]
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to analyze command: ${error}`,
        ['Check command syntax', 'Try a simpler command']
      );
    }
  }

  private analyzeCommand(command: string): {
    analysis: string;
    suggestions: string[];
    safe: boolean;
    alternatives: string[];
  } {
    const lowerCommand = command.toLowerCase();
    
    // Analyze common commands
    if (lowerCommand.startsWith('npm ')) {
      return this.analyzeNpmCommand(command);
    } else if (lowerCommand.startsWith('yarn ')) {
      return this.analyzeYarnCommand(command);
    } else if (lowerCommand.startsWith('git ')) {
      return this.analyzeGitCommand(command);
    } else if (lowerCommand.startsWith('node ')) {
      return this.analyzeNodeCommand(command);
    } else if (lowerCommand.includes('rm ') || lowerCommand.includes('del ')) {
      return this.analyzeDeleteCommand(command);
    }

    return this.analyzeGenericCommand(command);
  }

  private analyzeNpmCommand(command: string): any {
    const parts = command.split(' ');
    const subcommand = parts[1];

    switch (subcommand) {
      case 'install':
      case 'i':
        return {
          analysis: 'Installs Node.js dependencies from package.json',
          suggestions: [
            'Make sure package.json exists',
            'Check if you have internet connection',
            'Consider using npm ci for faster, reliable installs'
          ],
          safe: true,
          alternatives: ['yarn install', 'pnpm install']
        };
      
      case 'start':
        return {
          analysis: 'Runs the start script defined in package.json',
          suggestions: [
            'Ensure start script is defined in package.json',
            'Check if all dependencies are installed first'
          ],
          safe: true,
          alternatives: ['yarn start', 'node index.js']
        };

      case 'run':
        return {
          analysis: `Runs the custom script: ${parts.slice(2).join(' ')}`,
          suggestions: [
            'Verify the script exists in package.json',
            'Check script dependencies'
          ],
          safe: true,
          alternatives: [`yarn run ${parts.slice(2).join(' ')}`]
        };

      default:
        return {
          analysis: `NPM command: ${command}`,
          suggestions: ['Check NPM documentation for this command'],
          safe: true,
          alternatives: []
        };
    }
  }

  private analyzeYarnCommand(command: string): any {
    return {
      analysis: 'Yarn package manager command',
      suggestions: [
        'Make sure Yarn is installed',
        'Check if package.json exists'
      ],
      safe: true,
      alternatives: [command.replace('yarn', 'npm')]
    };
  }

  private analyzeGitCommand(command: string): any {
    const parts = command.split(' ');
    const subcommand = parts[1];

    switch (subcommand) {
      case 'clone':
        return {
          analysis: 'Clones a Git repository',
          suggestions: [
            'Make sure you have access to the repository',
            'Check if Git is installed'
          ],
          safe: true,
          alternatives: []
        };

      case 'add':
        return {
          analysis: 'Stages files for commit',
          suggestions: [
            'Review files before staging',
            'Use git status to see changes'
          ],
          safe: true,
          alternatives: ['git add -A', 'git add .']
        };

      case 'commit':
        return {
          analysis: 'Creates a commit with staged changes',
          suggestions: [
            'Write a clear commit message',
            'Stage files first with git add'
          ],
          safe: true,
          alternatives: ['git commit -am "message"']
        };

      case 'push':
        return {
          analysis: 'Pushes commits to remote repository',
          suggestions: [
            'Make sure you have push access',
            'Commit changes first'
          ],
          safe: true,
          alternatives: []
        };

      default:
        return {
          analysis: `Git command: ${command}`,
          suggestions: ['Check Git documentation'],
          safe: true,
          alternatives: []
        };
    }
  }

  private analyzeNodeCommand(command: string): any {
    return {
      analysis: 'Executes a Node.js file',
      suggestions: [
        'Make sure Node.js is installed',
        'Check if the file exists',
        'Verify file permissions'
      ],
      safe: true,
      alternatives: []
    };
  }

  private analyzeDeleteCommand(command: string): any {
    return {
      analysis: '⚠️ DANGEROUS: This command deletes files or directories',
      suggestions: [
        '🛑 BE VERY CAREFUL - This operation is irreversible',
        'Double-check the file/directory path',
        'Consider making a backup first',
        'Use trash/recycle bin commands instead'
      ],
      safe: false,
      alternatives: [
        'Move files to trash instead of permanent deletion',
        'Use safer file management tools'
      ]
    };
  }

  private analyzeGenericCommand(command: string): any {
    const dangerousCommands = ['rm', 'del', 'format', 'fdisk', 'dd', 'mkfs'];
    const isDangerous = dangerousCommands.some(cmd => 
      command.toLowerCase().includes(cmd)
    );

    return {
      analysis: isDangerous 
        ? '⚠️ WARNING: This appears to be a potentially dangerous command'
        : 'Generic system command',
      suggestions: isDangerous 
        ? [
            '🛑 Exercise extreme caution',
            'Make sure you understand what this command does',
            'Consider safer alternatives'
          ]
        : [
            'Make sure the command is installed on your system',
            'Check the command documentation'
          ],
      safe: !isDangerous,
      alternatives: []
    };
  }

  // Get common command suggestions based on context
  getCommandSuggestions(context: any): string[] {
    const suggestions: string[] = [];

    // Package management
    suggestions.push(
      'npm install',
      'npm start', 
      'npm run build',
      'npm test'
    );

    // Git commands
    suggestions.push(
      'git status',
      'git add .',
      'git commit -m "message"',
      'git push'
    );

    // Development commands
    suggestions.push(
      'node index.js',
      'npx create-react-app my-app',
      'yarn install',
      'yarn start'
    );

    return suggestions;
  }
}