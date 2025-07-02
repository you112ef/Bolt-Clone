// AI Agents System Types
export interface AIContext {
  currentFile?: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  openTabs?: string[];
  unsavedChanges?: Record<string, string>;
  projectStructure?: FileNode[];
  recentActivity?: ActivityItem[];
}

export interface ActivityItem {
  type: 'file_opened' | 'text_selected' | 'code_edited' | 'search_performed';
  timestamp: number;
  data: any;
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: number;
  dependencies?: string[];
  exports?: string[];
  imports?: string[];
}

export interface AgentRequest {
  type: AgentType;
  context: AIContext;
  input: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  suggestions?: string[];
  actions?: AgentAction[];
}

export interface AgentAction {
  type: 'edit_code' | 'create_file' | 'run_command' | 'show_suggestion' | 'open_file';
  payload: any;
  description: string;
}

export type AgentType = 
  | 'explainer'
  | 'fixer'
  | 'refactor'
  | 'test'
  | 'scaffold'
  | 'command'
  | 'search';

export interface Agent {
  type: AgentType;
  name: string;
  description: string;
  process(request: AgentRequest): Promise<AgentResponse>;
  canHandle(request: AgentRequest): boolean;
}

export interface SearchResult {
  path: string;
  content: string;
  score: number;
  type: 'semantic' | 'fuzzy' | 'exact';
  context?: string;
}

export interface EmbeddingChunk {
  id: string;
  path: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface TerminalCommand {
  command: string;
  output: string;
  error?: string;
  exitCode: number;
  timestamp: number;
}

export interface ImageAnalysisResult {
  text?: string;
  codeBlocks?: string[];
  language?: string;
  confidence: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: AIContext;
  actions?: AgentAction[];
}