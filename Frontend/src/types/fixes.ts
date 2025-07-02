// Type fixes for production build
import * as monaco from 'monaco-editor';

// Extend AgentResponse to match implementation
export interface ExtendedAgentResponse {
  explanation: string;
  code?: string;
  confidence?: number;
  model?: string;
  suggestedCommands?: string[];
  safetyWarning?: string;
}

// Extend ImageAnalysisResult
export interface ExtendedImageAnalysisResult {
  extractedCode: string[];
  language?: string;
  confidence: number;
}

// Global monaco types
declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

// Export monaco for components
export { monaco };