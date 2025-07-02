import { LANGUAGE_MAP, getLanguageByFilename, DEFAULT_LANGUAGE_CONFIG, LanguageConfig } from '../config/languageMap';
import { AgentManager } from './AgentManager';
import { BaseAgent } from './BaseAgent';

// AI Model API configurations
interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  apiKey?: string;
  endpoint?: string;
  maxTokens: number;
  temperature: number;
  features: ModelFeature[];
}

interface ModelFeature {
  type: 'text' | 'code' | 'vision' | 'function_calling' | 'streaming';
  supported: boolean;
}

interface RouteContext {
  filename?: string;
  language?: string;
  content?: string;
  action?: string;
  userPreference?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

interface ModelResponse {
  content: string;
  model: string;
  tokens: number;
  cached: boolean;
  confidence: number;
}

// Model configurations for different AI providers
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 8192,
    temperature: 0.1,
    features: [
      { type: 'text', supported: true },
      { type: 'code', supported: true },
      { type: 'function_calling', supported: true },
      { type: 'streaming', supported: true },
      { type: 'vision', supported: false }
    ]
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 8192,
    temperature: 0.1,
    features: [
      { type: 'text', supported: true },
      { type: 'code', supported: true },
      { type: 'vision', supported: true },
      { type: 'function_calling', supported: true },
      { type: 'streaming', supported: true }
    ]
  },
  'claude': {
    id: 'claude',
    name: 'Claude-3',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 4096,
    temperature: 0.1,
    features: [
      { type: 'text', supported: true },
      { type: 'code', supported: true },
      { type: 'function_calling', supported: true },
      { type: 'streaming', supported: true },
      { type: 'vision', supported: false }
    ]
  },
  'gemini-vision': {
    id: 'gemini-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent',
    maxTokens: 2048,
    temperature: 0.2,
    features: [
      { type: 'text', supported: true },
      { type: 'code', supported: true },
      { type: 'vision', supported: true },
      { type: 'streaming', supported: false },
      { type: 'function_calling', supported: false }
    ]
  },
  'mistral': {
    id: 'mistral',
    name: 'Mistral Large',
    provider: 'mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    maxTokens: 4096,
    temperature: 0.1,
    features: [
      { type: 'text', supported: true },
      { type: 'code', supported: true },
      { type: 'function_calling', supported: true },
      { type: 'streaming', supported: true },
      { type: 'vision', supported: false }
    ]
  }
};

export class AgentRouter {
  private agentManager: AgentManager;
  private modelCache: Map<string, ModelResponse> = new Map();
  private requestCache: Map<string, Promise<ModelResponse>> = new Map();
  private failoverChain: Record<string, string[]> = {
    'gpt-4': ['gpt-4o', 'claude', 'mistral'],
    'gpt-4o': ['gpt-4', 'claude', 'mistral'],
    'claude': ['gpt-4', 'gpt-4o', 'mistral'],
    'gemini-vision': ['gpt-4o', 'gpt-4', 'claude'],
    'mistral': ['gpt-4o', 'gpt-4', 'claude']
  };

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    this.initializeAPIKeys();
  }

  private initializeAPIKeys(): void {
    // Initialize API keys from environment or Cloudflare Pages environment variables
    if (typeof window !== 'undefined') {
      // Client-side - should get keys from secure backend
      console.warn('API keys should be handled server-side for security');
    } else {
      // Server-side or build-time
      MODEL_CONFIGS['gpt-4'].apiKey = process.env.OPENAI_API_KEY;
      MODEL_CONFIGS['gpt-4o'].apiKey = process.env.OPENAI_API_KEY;
      MODEL_CONFIGS['claude'].apiKey = process.env.ANTHROPIC_API_KEY;
      MODEL_CONFIGS['gemini-vision'].apiKey = process.env.GOOGLE_API_KEY;
      MODEL_CONFIGS['mistral'].apiKey = process.env.MISTRAL_API_KEY;
    }
  }

  /**
   * Route request to appropriate AI model based on context
   */
  public async route(
    prompt: string,
    context: RouteContext,
    agent?: BaseAgent
  ): Promise<ModelResponse> {
    const selectedModel = this.selectModel(context);
    const cacheKey = this.generateCacheKey(prompt, context, selectedModel);

    // Check cache first
    if (this.modelCache.has(cacheKey)) {
      const cached = this.modelCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    // Check for ongoing request
    if (this.requestCache.has(cacheKey)) {
      return await this.requestCache.get(cacheKey)!;
    }

    // Create new request with failover
    const requestPromise = this.executeWithFailover(prompt, context, selectedModel);
    this.requestCache.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      this.modelCache.set(cacheKey, response);
      this.requestCache.delete(cacheKey);
      return response;
    } catch (error) {
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Select optimal model based on context
   */
  private selectModel(context: RouteContext): string {
    let languageConfig: LanguageConfig;

    // Determine language configuration
    if (context.filename) {
      languageConfig = getLanguageByFilename(context.filename) || DEFAULT_LANGUAGE_CONFIG;
    } else if (context.language && LANGUAGE_MAP[context.language]) {
      languageConfig = LANGUAGE_MAP[context.language];
    } else {
      languageConfig = DEFAULT_LANGUAGE_CONFIG;
    }

    // Handle user preferences
    if (context.userPreference && MODEL_CONFIGS[context.userPreference]) {
      return context.userPreference;
    }

    // Handle specific actions that require certain capabilities
    if (context.action) {
      switch (context.action) {
        case 'analyze_image':
        case 'extract_code_from_image':
          return 'gemini-vision';
        case 'optimize_performance':
        case 'refactor_complex':
          return 'gpt-4';
        case 'generate_tests':
          return languageConfig.aiModel;
        default:
          break;
      }
    }

    // Handle complexity-based routing
    if (context.complexity === 'complex') {
      return 'gpt-4';
    }

    // Handle content size
    if (context.content && context.content.length > 10000) {
      return 'claude'; // Better for long context
    }

    // Default to language-specific model
    return languageConfig.aiModel;
  }

  /**
   * Execute request with automatic failover
   */
  private async executeWithFailover(
    prompt: string,
    context: RouteContext,
    modelId: string,
    attemptedModels: Set<string> = new Set()
  ): Promise<ModelResponse> {
    if (attemptedModels.has(modelId)) {
      throw new Error('All failover models exhausted');
    }

    attemptedModels.add(modelId);

    try {
      return await this.executeRequest(prompt, context, modelId);
    } catch (error) {
      console.warn(`Model ${modelId} failed:`, error);

      // Try failover models
      const failoverModels = this.failoverChain[modelId] || [];
      for (const fallbackModel of failoverModels) {
        if (!attemptedModels.has(fallbackModel)) {
          try {
            return await this.executeWithFailover(prompt, context, fallbackModel, attemptedModels);
          } catch (fallbackError) {
            console.warn(`Fallback model ${fallbackModel} also failed:`, fallbackError);
            continue;
          }
        }
      }

      throw new Error(`All models failed. Last error: ${error}`);
    }
  }

  /**
   * Execute actual API request
   */
  private async executeRequest(
    prompt: string,
    context: RouteContext,
    modelId: string
  ): Promise<ModelResponse> {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      throw new Error(`Model configuration not found: ${modelId}`);
    }

    // For Cloudflare Pages, use edge functions or external API
    if (this.isCloudflarePages()) {
      return await this.executeCloudflareRequest(prompt, context, config);
    }

    // Fallback to direct API calls (development only)
    return await this.executeDirectRequest(prompt, context, config);
  }

  /**
   * Execute request via Cloudflare Pages Functions
   */
  private async executeCloudflareRequest(
    prompt: string,
    context: RouteContext,
    config: ModelConfig
  ): Promise<ModelResponse> {
    const endpoint = `/api/ai/${config.id}`;
    
    const requestBody = {
      prompt,
      context,
      model: config.id,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      content: result.content,
      model: config.id,
      tokens: result.tokens || 0,
      cached: false,
      confidence: result.confidence || 0.8
    };
  }

  /**
   * Execute direct API request (development/fallback)
   */
  private async executeDirectRequest(
    prompt: string,
    context: RouteContext,
    config: ModelConfig
  ): Promise<ModelResponse> {
    // This would be used in development or as fallback
    // In production, all requests should go through Cloudflare Functions
    
    const enhancedPrompt = this.enhancePrompt(prompt, context);
    
    switch (config.provider) {
      case 'openai':
        return await this.callOpenAI(enhancedPrompt, config);
      case 'anthropic':
        return await this.callAnthropic(enhancedPrompt, config);
      case 'google':
        return await this.callGoogle(enhancedPrompt, config);
      case 'mistral':
        return await this.callMistral(enhancedPrompt, config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Enhance prompt with context information
   */
  private enhancePrompt(prompt: string, context: RouteContext): string {
    let enhanced = prompt;

    if (context.filename) {
      enhanced = `File: ${context.filename}\n\n${enhanced}`;
    }

    if (context.language) {
      enhanced = `Language: ${context.language}\n\n${enhanced}`;
    }

    if (context.content) {
      enhanced = `${enhanced}\n\nCode Context:\n\`\`\`${context.language || 'text'}\n${context.content}\n\`\`\``;
    }

    return enhanced;
  }

  /**
   * OpenAI API call
   */
  private async callOpenAI(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.id === 'gpt-4o' ? 'gpt-4o' : 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    const result = await response.json();
    return {
      content: result.choices[0].message.content,
      model: config.id,
      tokens: result.usage?.total_tokens || 0,
      cached: false,
      confidence: 0.9
    };
  }

  /**
   * Anthropic API call
   */
  private async callAnthropic(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature
      })
    });

    const result = await response.json();
    return {
      content: result.content[0].text,
      model: config.id,
      tokens: result.usage?.input_tokens + result.usage?.output_tokens || 0,
      cached: false,
      confidence: 0.85
    };
  }

  /**
   * Google Gemini API call
   */
  private async callGoogle(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature
        }
      })
    });

    const result = await response.json();
    return {
      content: result.candidates[0].content.parts[0].text,
      model: config.id,
      tokens: 0, // Google doesn't provide token counts in the same way
      cached: false,
      confidence: 0.8
    };
  }

  /**
   * Mistral API call
   */
  private async callMistral(prompt: string, config: ModelConfig): Promise<ModelResponse> {
    const response = await fetch(config.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    const result = await response.json();
    return {
      content: result.choices[0].message.content,
      model: config.id,
      tokens: result.usage?.total_tokens || 0,
      cached: false,
      confidence: 0.8
    };
  }

  /**
   * Check if running on Cloudflare Pages
   */
  private isCloudflarePages(): boolean {
    return typeof window !== 'undefined' || 
           process.env.CF_PAGES === '1' || 
           process.env.CLOUDFLARE_ENV !== undefined;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(prompt: string, context: RouteContext, model: string): string {
    const contextStr = JSON.stringify({
      filename: context.filename,
      language: context.language,
      action: context.action
    });
    
    const hash = this.simpleHash(prompt + contextStr + model);
    return `${model}:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.modelCache.clear();
    this.requestCache.clear();
  }

  /**
   * Get available models
   */
  public getAvailableModels(): ModelConfig[] {
    return Object.values(MODEL_CONFIGS);
  }

  /**
   * Get model configuration
   */
  public getModelConfig(modelId: string): ModelConfig | null {
    return MODEL_CONFIGS[modelId] || null;
  }

  /**
   * Health check for models
   */
  public async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [modelId, config] of Object.entries(MODEL_CONFIGS)) {
      try {
        const testPrompt = 'Hello, respond with "OK"';
        const response = await this.executeRequest(testPrompt, {}, modelId);
        results[modelId] = response.content.includes('OK');
      } catch (error) {
        results[modelId] = false;
      }
    }
    
    return results;
  }
}