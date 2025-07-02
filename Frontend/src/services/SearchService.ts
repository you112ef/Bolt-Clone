import { pipeline, Pipeline } from '@xenova/transformers';
import Fuse from 'fuse.js';
import { SearchResult, EmbeddingChunk } from '../types/agents';
import { FileItem } from '../types';

export class SearchService {
  private static instance: SearchService;
  private embedder: Pipeline | null = null;
  private chunks: EmbeddingChunk[] = [];
  private fuseIndex: Fuse<EmbeddingChunk> | null = null;
  private isInitialized = false;
  
  // Cloudflare Pages optimization
  private readonly CACHE_KEY = 'ai-agent-search-cache-v3';
  private readonly INDEX_VERSION = 3;
  private dbPromise: Promise<IDBDatabase> | null = null;

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeIndexedDB();
    }
  }

  // Initialize IndexedDB for offline caching
  private async initializeIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('ai-agent-search', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('embeddings')) {
          const store = db.createObjectStore('embeddings', { keyPath: 'id' });
          store.createIndex('path', 'path', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('search-cache')) {
          db.createObjectStore('search-cache', { keyPath: 'query' });
        }
      };
    });
    
    return this.dbPromise;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize the embedding pipeline
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { 
          device: 'webgpu',
          fallback_device: 'cpu'
        }
      );

      this.isInitialized = true;
      console.log('SearchService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SearchService:', error);
      // Fallback to simpler search without embeddings
      this.isInitialized = true;
    }
  }

  // Index files for search
  async indexFiles(files: FileItem[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.chunks = [];
    
    const processFile = async (file: FileItem) => {
      if (file.type === 'file' && file.content) {
        const chunks = this.splitIntoChunks(file.content, file.path);
        
        for (const chunk of chunks) {
          let embedding: number[] = [];
          
          if (this.embedder) {
            try {
              const result = await this.embedder(chunk.content, {
                pooling: 'mean',
                normalize: true
              });
              embedding = Array.from(result.data as Float32Array);
            } catch (error) {
              console.warn(`Failed to generate embedding for ${file.path}:`, error);
            }
          }

          this.chunks.push({
            ...chunk,
            embedding
          });
        }
      }

      if (file.type === 'folder' && file.children) {
        for (const child of file.children) {
          await processFile(child);
        }
      }
    };

    for (const file of files) {
      await processFile(file);
    }

    // Initialize Fuse for fuzzy search
    this.fuseIndex = new Fuse(this.chunks, {
      keys: ['content', 'path'],
      threshold: 0.3,
      includeScore: true
    });

    console.log(`Indexed ${this.chunks.length} chunks for search`);
  }

  // Split file content into searchable chunks
  private splitIntoChunks(content: string, path: string): Omit<EmbeddingChunk, 'embedding'>[] {
    const chunks: Omit<EmbeddingChunk, 'embedding'>[] = [];
    const maxChunkSize = 512;
    const overlap = 50;

    // For code files, split by functions/classes when possible
    if (this.isCodeFile(path)) {
      const codeChunks = this.splitCodeIntoLogicalChunks(content, path);
      if (codeChunks.length > 0) {
        return codeChunks;
      }
    }

    // Fallback to simple text chunking
    const lines = content.split('\n');
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `${path}_chunk_${chunkIndex++}`,
          path,
          content: currentChunk.trim(),
          metadata: {
            startLine: i - currentChunk.split('\n').length + 1,
            endLine: i
          }
        });

        // Keep some overlap
        const overlapLines = currentChunk.split('\n').slice(-overlap);
        currentChunk = overlapLines.join('\n') + '\n' + line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${path}_chunk_${chunkIndex}`,
        path,
        content: currentChunk.trim(),
        metadata: {
          startLine: lines.length - currentChunk.split('\n').length + 1,
          endLine: lines.length
        }
      });
    }

    return chunks;
  }

  // Split code into logical chunks (functions, classes, etc.)
  private splitCodeIntoLogicalChunks(content: string, path: string): Omit<EmbeddingChunk, 'embedding'>[] {
    const chunks: Omit<EmbeddingChunk, 'embedding'>[] = [];
    const lines = content.split('\n');
    
    // Patterns for different code constructs
    const patterns = {
      function: /^\s*(export\s+)?(async\s+)?function\s+\w+|^\s*(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
      class: /^\s*(export\s+)?class\s+\w+/,
      interface: /^\s*(export\s+)?interface\s+\w+/,
      type: /^\s*(export\s+)?type\s+\w+/,
      component: /^\s*(export\s+)?(const|function)\s+\w+\s*=.*=>/
    };

    let currentChunk = '';
    let chunkStartLine = 0;
    let braceLevel = 0;
    let inCodeBlock = false;
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're starting a new logical block
      const isNewBlock = Object.values(patterns).some(pattern => pattern.test(line));
      
      if (isNewBlock && currentChunk.trim() && braceLevel === 0) {
        // Save the previous chunk
        chunks.push({
          id: `${path}_chunk_${chunkIndex++}`,
          path,
          content: currentChunk.trim(),
          metadata: {
            startLine: chunkStartLine + 1,
            endLine: i,
            type: 'code_block'
          }
        });

        currentChunk = '';
        chunkStartLine = i;
      }

      currentChunk += (currentChunk ? '\n' : '') + line;

      // Track brace levels for proper chunking
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceLevel += openBraces - closeBraces;

      // If we're at the end and have content, save it
      if (i === lines.length - 1 && currentChunk.trim()) {
        chunks.push({
          id: `${path}_chunk_${chunkIndex}`,
          path,
          content: currentChunk.trim(),
          metadata: {
            startLine: chunkStartLine + 1,
            endLine: i + 1,
            type: 'code_block'
          }
        });
      }
    }

    return chunks;
  }

  // Perform semantic search using embeddings
  async semanticSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.embedder || this.chunks.length === 0) {
      return [];
    }

    try {
      // Generate embedding for the query
      const queryResult = await this.embedder(query, {
        pooling: 'mean',
        normalize: true
      });
      const queryEmbedding = Array.from(queryResult.data as Float32Array);

      // Calculate similarities
      const similarities = this.chunks
        .filter(chunk => chunk.embedding.length > 0)
        .map(chunk => ({
          chunk,
          similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return similarities.map(({ chunk, similarity }) => ({
        path: chunk.path,
        content: chunk.content,
        score: similarity,
        type: 'semantic' as const,
        context: this.getSearchContext(chunk)
      }));
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  // Perform fuzzy search
  fuzzySearch(query: string, limit: number = 10): SearchResult[] {
    if (!this.fuseIndex) {
      return [];
    }

    const results = this.fuseIndex.search(query, { limit });
    
    return results.map((result: any) => ({
      path: result.item.path,
      content: result.item.content,
      score: 1 - (result.score || 0),
      type: 'fuzzy' as const,
      context: this.getSearchContext(result.item)
    }));
  }

  // Perform exact text search
  exactSearch(query: string, limit: number = 10): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const chunk of this.chunks) {
      const content = chunk.content.toLowerCase();
      const index = content.indexOf(lowerQuery);
      
      if (index !== -1) {
        results.push({
          path: chunk.path,
          content: chunk.content,
          score: 1.0,
          type: 'exact' as const,
          context: this.getSearchContext(chunk, index)
        });

        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // Combined search with all methods
  async search(query: string, options: {
    semantic?: boolean;
    fuzzy?: boolean;
    exact?: boolean;
    limit?: number;
  } = {}): Promise<SearchResult[]> {
    const { 
      semantic = true, 
      fuzzy = true, 
      exact = true, 
      limit = 20 
    } = options;

    const allResults: SearchResult[] = [];

    if (semantic) {
      const semanticResults = await this.semanticSearch(query, Math.ceil(limit / 3));
      allResults.push(...semanticResults);
    }

    if (fuzzy) {
      const fuzzyResults = this.fuzzySearch(query, Math.ceil(limit / 3));
      allResults.push(...fuzzyResults);
    }

    if (exact) {
      const exactResults = this.exactSearch(query, Math.ceil(limit / 3));
      allResults.push(...exactResults);
    }

    // Remove duplicates and merge results
    const uniqueResults = this.deduplicateResults(allResults);
    
    // Sort by score and return top results
    return uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get context around search result
  private getSearchContext(chunk: EmbeddingChunk, highlightIndex?: number): string {
    if (highlightIndex !== undefined) {
      const start = Math.max(0, highlightIndex - 100);
      const end = Math.min(chunk.content.length, highlightIndex + 100);
      return chunk.content.substring(start, end);
    }

    return chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : '');
  }

  // Remove duplicate results
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      const key = `${result.path}:${result.content.substring(0, 100)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  // Check if file is a code file
  private isCodeFile(path: string): boolean {
    const codeExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'vue', 'py', 'java', 'cpp', 'c', 'h',
      'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'dart'
    ];
    
    const extension = path.split('.').pop()?.toLowerCase();
    return extension ? codeExtensions.includes(extension) : false;
  }

  // Answer natural language questions about the codebase
  async answerQuestion(question: string): Promise<{
    answer: string;
    sources: SearchResult[];
  }> {
    const searchResults = await this.search(question, { limit: 5 });
    
    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find relevant information in the codebase to answer your question.",
        sources: []
      };
    }

    // Simple question answering logic
    const context = searchResults.map(r => r.content).join('\n\n');
    let answer = '';

    if (question.toLowerCase().includes('where') || question.toLowerCase().includes('find')) {
      const files = [...new Set(searchResults.map(r => r.path))];
      answer = `Found relevant code in ${files.length} files: ${files.join(', ')}`;
    } else if (question.toLowerCase().includes('what') || question.toLowerCase().includes('how')) {
      answer = `Based on the codebase analysis:\n\n${searchResults[0]?.content.substring(0, 300)}...`;
    } else {
      answer = `Found ${searchResults.length} relevant code sections that might help answer your question.`;
    }

    return {
      answer,
      sources: searchResults
    };
  }
}