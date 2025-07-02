import { BaseAgent } from './BaseAgent';
import { AgentRequest, AgentResponse, AgentType } from '../types/agents';

export class TestAgent extends BaseAgent {
  type: AgentType = 'test';
  name = 'Test Generator';
  description = 'Generates unit tests for functions and components';

  canHandle(request: AgentRequest): boolean {
    return request.type === 'test' && 
           (!!request.context.selectedText || !!request.context.currentFile);
  }

  async process(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { selectedText, currentFile } = request.context;
      const codeToTest = selectedText || request.input;

      if (!codeToTest) {
        return this.createErrorResponse(
          'No code selected or provided to generate tests for',
          ['Select a function or component to test', 'Provide code in your request']
        );
      }

      const language = this.getLanguageFromContext(request);
      const testSuite = this.generateTests(codeToTest, language, currentFile);

      return this.createSuccessResponse(
        {
          originalCode: codeToTest,
          testCode: testSuite.code,
          testCases: testSuite.testCases,
          framework: testSuite.framework,
          coverage: testSuite.expectedCoverage
        },
        [
          'Review the generated tests and add edge cases',
          'Install the test framework if not already available',
          'Run the tests to verify they work correctly'
        ]
      );
    } catch (error) {
      return this.createErrorResponse(
        `Failed to generate tests: ${error}`,
        ['Ensure the code contains testable functions', 'Try with a simpler code snippet']
      );
    }
  }

  private generateTests(code: string, language: string, filename?: string): {
    code: string;
    testCases: Array<{ name: string; description: string; type: string }>;
    framework: string;
    expectedCoverage: string;
  } {
    const structure = this.extractCodeStructure(code);
    const framework = this.getTestFramework(language, filename);
    const testCases: Array<{ name: string; description: string; type: string }> = [];

    let testCode = this.generateTestFileHeader(framework, filename);

    // Generate tests for each function
    structure.functions.forEach(functionName => {
      const functionTests = this.generateFunctionTests(functionName, code, framework);
      testCode += functionTests.code;
      testCases.push(...functionTests.cases);
    });

    // Generate tests for classes
    structure.classes.forEach(className => {
      const classTests = this.generateClassTests(className, code, framework);
      testCode += classTests.code;
      testCases.push(...classTests.cases);
    });

    const expectedCoverage = this.calculateExpectedCoverage(testCases);

    return {
      code: testCode,
      testCases,
      framework,
      expectedCoverage
    };
  }

  private getTestFramework(language: string, filename?: string): string {
    if (language === 'javascript' || language === 'typescript') {
      // Check if it's a React component
      if (filename?.includes('component') || filename?.includes('.tsx') || filename?.includes('.jsx')) {
        return 'React Testing Library + Jest';
      }
      return 'Jest';
    } else if (language === 'python') {
      return 'pytest';
    } else if (language === 'java') {
      return 'JUnit';
    } else if (language === 'csharp') {
      return 'xUnit';
    }
    return 'Generic Testing Framework';
  }

  private generateTestFileHeader(framework: string, filename?: string): string {
    const testFilename = filename?.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1') || 'code.test.js';
    
    if (framework === 'Jest' || framework.includes('Jest')) {
      return `// Generated tests for ${filename || 'code'}
import { ${this.getImportsFromCode()} } from './${filename?.replace(/\.(ts|js|tsx|jsx)$/, '') || 'code'}';

describe('${filename?.replace(/\.(ts|js|tsx|jsx)$/, '') || 'Code'} Tests', () => {
`;
    } else if (framework === 'pytest') {
      return `# Generated tests for ${filename || 'code'}
import pytest
from ${filename?.replace('.py', '') || 'code'} import *

class Test${filename?.replace('.py', '').replace(/[^a-zA-Z0-9]/g, '') || 'Code'}:
`;
    }
    
    return `// Generated tests\n`;
  }

  private generateFunctionTests(functionName: string, code: string, framework: string): {
    code: string;
    cases: Array<{ name: string; description: string; type: string }>;
  } {
    const cases: Array<{ name: string; description: string; type: string }> = [];
    let testCode = '';

    if (framework.includes('Jest')) {
      testCode += `
  describe('${functionName}', () => {
    test('should handle valid input', () => {
      // TODO: Add test implementation
      expect(${functionName}(/* valid input */)).toBeDefined();
    });

    test('should handle edge cases', () => {
      // TODO: Test edge cases
      expect(${functionName}(null)).toThrow();
      expect(${functionName}(undefined)).toThrow();
    });

    test('should return expected output type', () => {
      const result = ${functionName}(/* test input */);
      expect(typeof result).toBe('/* expected type */');
    });
  });
`;

      cases.push(
        { name: `${functionName} - valid input`, description: 'Tests normal operation', type: 'positive' },
        { name: `${functionName} - edge cases`, description: 'Tests null/undefined inputs', type: 'edge' },
        { name: `${functionName} - return type`, description: 'Validates return type', type: 'contract' }
      );
    }

    return { code: testCode, cases };
  }

  private generateClassTests(className: string, code: string, framework: string): {
    code: string;
    cases: Array<{ name: string; description: string; type: string }>;
  } {
    const cases: Array<{ name: string; description: string; type: string }> = [];
    let testCode = '';

    if (framework.includes('Jest')) {
      testCode += `
  describe('${className}', () => {
    let instance;

    beforeEach(() => {
      instance = new ${className}(/* constructor params */);
    });

    test('should instantiate correctly', () => {
      expect(instance).toBeInstanceOf(${className});
    });

    test('should have expected methods', () => {
      // TODO: Add method tests
      expect(typeof instance.method).toBe('function');
    });
  });
`;

      cases.push(
        { name: `${className} - instantiation`, description: 'Tests class creation', type: 'constructor' },
        { name: `${className} - methods`, description: 'Tests method availability', type: 'interface' }
      );
    }

    return { code: testCode, cases };
  }

  private getImportsFromCode(): string {
    // Extract function and class names for imports
    // This is a simplified implementation
    return '/* add imports */';
  }

  private calculateExpectedCoverage(testCases: Array<{ name: string; description: string; type: string }>): string {
    const totalCases = testCases.length;
    if (totalCases === 0) return '0%';
    
    const edgeCases = testCases.filter(tc => tc.type === 'edge').length;
    const positiveCases = testCases.filter(tc => tc.type === 'positive').length;
    
    let coverage = 60; // Base coverage
    if (edgeCases > 0) coverage += 20;
    if (positiveCases > 1) coverage += 15;
    if (totalCases > 5) coverage += 5;
    
    return `${Math.min(coverage, 95)}%`;
  }
}