import { Agent, AgentRequest, AgentResponse, AgentType } from '../types/agents';
import { ExplainerAgent } from './ExplainerAgent';
import { FixerAgent } from './FixerAgent';
import { RefactorAgent } from './RefactorAgent';
import { TestAgent } from './TestAgent';
import { ScaffoldAgent } from './ScaffoldAgent';
import { CommandRunnerAgent } from './CommandRunnerAgent';
import { ContextBuilder } from '../services/ContextBuilder';

export class AgentManager {
  private static instance: AgentManager;
  private agents: Map<AgentType, Agent> = new Map();
  private contextBuilder: ContextBuilder;

  private constructor() {
    this.contextBuilder = ContextBuilder.getInstance();
    this.initializeAgents();
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  private initializeAgents(): void {
    // Register all available agents
    const agents: Agent[] = [
      new ExplainerAgent(),
      new FixerAgent(),
      new RefactorAgent(),
      new TestAgent(),
      new ScaffoldAgent(),
      new CommandRunnerAgent()
    ];

    agents.forEach(agent => {
      this.agents.set(agent.type, agent);
    });

    console.log(`AgentManager initialized with ${agents.length} agents`);
  }

  // Process a request through the appropriate agent
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      const agent = this.agents.get(request.type);
      
      if (!agent) {
        return {
          success: false,
          error: `No agent available for type: ${request.type}`,
          suggestions: this.getAvailableAgentSuggestions()
        };
      }

      if (!agent.canHandle(request)) {
        return {
          success: false,
          error: `Agent ${agent.name} cannot handle this request`,
          suggestions: [
            'Check if you have selected code or provided input',
            'Try a different agent type',
            'Ensure your request context is complete'
          ]
        };
      }

      // Process the request
      const response = await agent.process(request);
      
      // Track activity for context building
      this.contextBuilder.addActivity({
        type: 'search_performed',
        data: {
          agentType: request.type,
          query: request.input,
          success: response.success
        }
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Agent processing failed: ${error}`,
        suggestions: [
          'Try again with a simpler request',
          'Check if your input is valid',
          'Contact support if the issue persists'
        ]
      };
    }
  }

  // Get the best agent for a natural language request
  async getBestAgent(input: string, context: any): Promise<AgentType | null> {
    const lowerInput = input.toLowerCase();

    // Keywords mapping to agent types
    const agentKeywords: Record<AgentType, string[]> = {
      explainer: ['explain', 'what does', 'how does', 'understand', 'analyze', 'describe'],
      fixer: ['fix', 'bug', 'error', 'problem', 'issue', 'broken', 'debug'],
      refactor: ['refactor', 'improve', 'optimize', 'clean', 'restructure', 'better'],
      test: ['test', 'unit test', 'testing', 'spec', 'coverage', 'assert'],
      scaffold: ['create', 'generate', 'scaffold', 'new', 'make', 'build'],
      command: ['run', 'execute', 'install', 'command', 'terminal', 'npm', 'yarn'],
      search: ['search', 'find', 'look for', 'locate', 'where is', 'show me']
    };

    // Score each agent based on keyword matches
    const scores: Record<AgentType, number> = {
      explainer: 0,
      fixer: 0,
      refactor: 0,
      test: 0,
      scaffold: 0,
      command: 0,
      search: 0
    };

    Object.entries(agentKeywords).forEach(([agentType, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerInput.includes(keyword)) {
          scores[agentType as AgentType] += 1;
        }
      });
    });

    // Find the agent with the highest score
    const bestAgent = Object.entries(scores).reduce((best, [agent, score]) => {
      return score > best.score ? { agent: agent as AgentType, score } : best;
    }, { agent: null as AgentType | null, score: 0 });

    return bestAgent.score > 0 ? bestAgent.agent : 'explainer'; // Default to explainer
  }

  // Process natural language request
  async processNaturalLanguageRequest(
    input: string,
    context: any
  ): Promise<AgentResponse> {
    const agentType = await this.getBestAgent(input, context);
    
    if (!agentType) {
      return {
        success: false,
        error: 'Could not determine the best agent for your request',
        suggestions: this.getAvailableAgentSuggestions()
      };
    }

    const request: AgentRequest = {
      type: agentType,
      input,
      context
    };

    return this.processRequest(request);
  }

  // Get available agents
  getAvailableAgents(): Array<{ type: AgentType; name: string; description: string }> {
    return Array.from(this.agents.values()).map(agent => ({
      type: agent.type,
      name: agent.name,
      description: agent.description
    }));
  }

  // Get agent by type
  getAgent(type: AgentType): Agent | undefined {
    return this.agents.get(type);
  }

  // Check if an agent is available
  hasAgent(type: AgentType): boolean {
    return this.agents.has(type);
  }

  // Process multiple requests in parallel
  async processMultipleRequests(requests: AgentRequest[]): Promise<AgentResponse[]> {
    const promises = requests.map(request => this.processRequest(request));
    return Promise.all(promises);
  }

  // Get suggestions for available agents
  private getAvailableAgentSuggestions(): string[] {
    const agents = this.getAvailableAgents();
    return [
      'Available agents:',
      ...agents.map(agent => `• ${agent.name}: ${agent.description}`),
      'Try specifying which agent you want to use'
    ];
  }

  // Handle agent workflow (chaining multiple agents)
  async runWorkflow(workflow: {
    steps: Array<{
      agentType: AgentType;
      input: string;
      useOutputFromPrevious?: boolean;
    }>;
    context: any;
  }): Promise<{
    success: boolean;
    results: AgentResponse[];
    finalResult?: any;
  }> {
    const results: AgentResponse[] = [];
    let previousOutput: any = null;

    try {
      for (const step of workflow.steps) {
        const input = step.useOutputFromPrevious && previousOutput 
          ? JSON.stringify(previousOutput) 
          : step.input;

        const request: AgentRequest = {
          type: step.agentType,
          input,
          context: workflow.context
        };

        const response = await this.processRequest(request);
        results.push(response);

        if (!response.success) {
          return {
            success: false,
            results,
            finalResult: response.error
          };
        }

        previousOutput = response.result;
      }

      return {
        success: true,
        results,
        finalResult: previousOutput
      };
    } catch (error) {
      return {
        success: false,
        results,
        finalResult: `Workflow failed: ${error}`
      };
    }
  }

  // Quick actions for common agent operations
  async explainCode(code: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'explainer',
      input: code,
      context
    });
  }

  async fixCode(code: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'fixer',
      input: code,
      context
    });
  }

  async refactorCode(code: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'refactor',
      input: code,
      context
    });
  }

  async generateTest(code: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'test',
      input: code,
      context
    });
  }

  async scaffoldProject(description: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'scaffold',
      input: description,
      context
    });
  }

  async runCommand(command: string, context: any): Promise<AgentResponse> {
    return this.processRequest({
      type: 'command',
      input: command,
      context
    });
  }

  // Common workflow presets
  async runCodeReviewWorkflow(code: string, context: any): Promise<{
    success: boolean;
    explanation: AgentResponse;
    fixes: AgentResponse;
    refactoring: AgentResponse;
    tests: AgentResponse;
  }> {
    const [explanation, fixes, refactoring, tests] = await Promise.all([
      this.explainCode(code, context),
      this.fixCode(code, context),
      this.refactorCode(code, context),
      this.generateTest(code, context)
    ]);

    return {
      success: explanation.success && fixes.success && refactoring.success && tests.success,
      explanation,
      fixes,
      refactoring,
      tests
    };
  }

  // Get agent statistics
  getAgentStats(): {
    totalAgents: number;
    availableAgents: string[];
    capabilities: string[];
  } {
    const agents = this.getAvailableAgents();
    
    return {
      totalAgents: agents.length,
      availableAgents: agents.map(a => a.name),
      capabilities: [
        'Code explanation and analysis',
        'Bug detection and fixing', 
        'Code refactoring and optimization',
        'Test generation',
        'Project scaffolding',
        'Command execution',
        'Natural language processing'
      ]
    };
  }
}