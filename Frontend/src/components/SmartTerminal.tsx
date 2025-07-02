import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { WebglAddon } from 'xterm-addon-webgl';
import { AttachAddon } from 'xterm-addon-attach';
import 'xterm/css/xterm.css';
import { getLanguageByFilename, canExecuteLanguage, LANGUAGE_MAP } from '../config/languageMap';
import { AgentManager } from '../agents/AgentManager';

interface SmartTerminalProps {
  className?: string;
  onCommandExecuted?: (command: string, output: string) => void;
  currentFile?: string;
  workingDirectory?: string;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: 'file' | 'git' | 'npm' | 'language' | 'system';
  confidence: number;
}

interface ExecutionContext {
  language?: string;
  filename?: string;
  runtime?: string;
  environment?: Record<string, string>;
}

export const SmartTerminal: React.FC<SmartTerminalProps> = ({
  className = '',
  onCommandExecuted,
  currentFile,
  workingDirectory = '/workspace'
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const agentManager = AgentManager.getInstance();

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#00ff00',
        cursorAccent: '#00ff00',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#1a1a1a',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#8be9fd',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#44475a',
        brightRed: '#ff5555',
        brightGreen: '#50fa7b',
        brightYellow: '#f1fa8c',
        brightBlue: '#8be9fd',
        brightMagenta: '#ff79c6',
        brightCyan: '#8be9fd',
        brightWhite: '#ffffff'
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, Courier New, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      tabStopWidth: 4,
      rightClickSelectsWord: true,
      macOptionIsMeta: true,
      allowTransparency: true
    });

    // Add addons
    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();
    const search = new SearchAddon();
    
    try {
      const webgl = new WebglAddon();
      term.loadAddon(webgl);
    } catch (e) {
      console.warn('WebGL addon not supported');
    }

    term.loadAddon(fit);
    term.loadAddon(webLinks);
    term.loadAddon(search);

    fitAddon.current = fit;
    terminal.current = term;

    // Open terminal
    term.open(terminalRef.current);
    fit.fit();

    // Initialize with welcome message
    initializeTerminal(term);

    // Handle input
    setupTerminalInput(term);

    // Handle resize
    const handleResize = () => {
      fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // Connect to WebSocket for real execution (in production)
    connectToExecutionService();

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []);

  // Initialize terminal with welcome message
  const initializeTerminal = (term: Terminal) => {
    term.writeln('\x1b[36m╭─────────────────────────────────────────────╮\x1b[0m');
    term.writeln('\x1b[36m│           Smart AI Terminal v2.0            │\x1b[0m');
    term.writeln('\x1b[36m│     Enhanced for Cloudflare Pages          │\x1b[0m');
    term.writeln('\x1b[36m╰─────────────────────────────────────────────╯\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[32m• Type commands or drag & drop files\x1b[0m');
    term.writeln('\x1b[32m• AI assistance with /ai <question>\x1b[0m');
    term.writeln('\x1b[32m• Language-aware execution support\x1b[0m');
    term.writeln('\x1b[32m• CTRL+C to interrupt, CTRL+L to clear\x1b[0m');
    term.writeln('');
    writePrompt(term);
  };

  // Setup terminal input handling
  const setupTerminalInput = (term: Terminal) => {
    let inputBuffer = '';
    let cursorPosition = 0;

    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        term.writeln('');
        if (inputBuffer.trim()) {
          executeCommand(inputBuffer.trim(), term);
          setCommandHistory(prev => [...prev, inputBuffer.trim()]);
          setHistoryIndex(-1);
        }
        inputBuffer = '';
        cursorPosition = 0;
        setCurrentCommand('');
        setShowSuggestions(false);
      } else if (code === 127) { // Backspace
        if (cursorPosition > 0) {
          inputBuffer = inputBuffer.slice(0, cursorPosition - 1) + inputBuffer.slice(cursorPosition);
          cursorPosition--;
          updateTerminalDisplay(term, inputBuffer, cursorPosition);
          handleCommandInput(inputBuffer);
        }
      } else if (code === 27) { // Escape sequences
        // Handle arrow keys, etc.
        const sequence = data.slice(1);
        if (sequence === '[A') { // Up arrow
          navigateHistory(-1, term, (cmd) => {
            inputBuffer = cmd;
            cursorPosition = cmd.length;
          });
        } else if (sequence === '[B') { // Down arrow
          navigateHistory(1, term, (cmd) => {
            inputBuffer = cmd;
            cursorPosition = cmd.length;
          });
        } else if (sequence === '[C') { // Right arrow
          if (cursorPosition < inputBuffer.length) {
            cursorPosition++;
            term.write('\x1b[C');
          }
        } else if (sequence === '[D') { // Left arrow
          if (cursorPosition > 0) {
            cursorPosition--;
            term.write('\x1b[D');
          }
        }
      } else if (code === 3) { // Ctrl+C
        term.writeln('^C');
        inputBuffer = '';
        cursorPosition = 0;
        setCurrentCommand('');
        setShowSuggestions(false);
        writePrompt(term);
      } else if (code === 12) { // Ctrl+L
        term.clear();
        writePrompt(term);
      } else if (code === 9) { // Tab
        handleTabCompletion(inputBuffer, term, (completion) => {
          inputBuffer = completion;
          cursorPosition = completion.length;
        });
      } else if (code >= 32 && code <= 126) { // Printable characters
        inputBuffer = inputBuffer.slice(0, cursorPosition) + data + inputBuffer.slice(cursorPosition);
        cursorPosition++;
        updateTerminalDisplay(term, inputBuffer, cursorPosition);
        handleCommandInput(inputBuffer);
      }
    });
  };

  // Update terminal display
  const updateTerminalDisplay = (term: Terminal, buffer: string, cursor: number) => {
    // Clear current line and rewrite
    term.write('\x1b[2K\x1b[G');
    writePrompt(term, false);
    term.write(buffer);
    
    // Position cursor
    const promptLength = getPromptLength();
    term.write(`\x1b[${promptLength + cursor + 1}G`);
  };

  // Write prompt
  const writePrompt = (term: Terminal, newline: boolean = true) => {
    const cwd = workingDirectory.split('/').pop() || 'workspace';
    const langInfo = currentFile ? detectLanguageInfo() : '';
    
    if (newline) term.writeln('');
    term.write(`\x1b[32m➜\x1b[0m \x1b[36m${cwd}\x1b[0m${langInfo} \x1b[32m$\x1b[0m `);
  };

  // Get prompt length for cursor positioning
  const getPromptLength = (): number => {
    const cwd = workingDirectory.split('/').pop() || 'workspace';
    const langInfo = currentFile ? detectLanguageInfo() : '';
    return `➜ ${cwd}${langInfo} $ `.length;
  };

  // Detect language info for prompt
  const detectLanguageInfo = (): string => {
    if (!currentFile) return '';
    
    const langConfig = getLanguageByFilename(currentFile);
    if (langConfig) {
      return ` \x1b[33m[${langConfig.name}]\x1b[0m`;
    }
    return '';
  };

  // Handle command input for suggestions
  const handleCommandInput = useCallback(async (input: string) => {
    setCurrentCommand(input);
    
    if (input.length > 2) {
      const suggestions = await generateCommandSuggestions(input);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [currentFile]);

  // Generate command suggestions
  const generateCommandSuggestions = async (input: string): Promise<CommandSuggestion[]> => {
    const suggestions: CommandSuggestion[] = [];
    
    // Basic command suggestions
    const basicCommands = [
      { cmd: 'ls', desc: 'List directory contents', cat: 'file' as const },
      { cmd: 'cd', desc: 'Change directory', cat: 'file' as const },
      { cmd: 'pwd', desc: 'Print working directory', cat: 'file' as const },
      { cmd: 'cat', desc: 'Display file contents', cat: 'file' as const },
      { cmd: 'git status', desc: 'Show git status', cat: 'git' as const },
      { cmd: 'git add', desc: 'Add files to git', cat: 'git' as const },
      { cmd: 'git commit', desc: 'Commit changes', cat: 'git' as const },
      { cmd: 'npm install', desc: 'Install npm packages', cat: 'npm' as const },
      { cmd: 'npm start', desc: 'Start npm script', cat: 'npm' as const },
      { cmd: 'npm run build', desc: 'Build project', cat: 'npm' as const }
    ];

    // Filter by input
    basicCommands.forEach(({ cmd, desc, cat }) => {
      if (cmd.toLowerCase().includes(input.toLowerCase())) {
        suggestions.push({
          command: cmd,
          description: desc,
          category: cat,
          confidence: cmd.startsWith(input.toLowerCase()) ? 0.9 : 0.6
        });
      }
    });

    // Language-specific suggestions
    if (currentFile) {
      const langConfig = getLanguageByFilename(currentFile);
      if (langConfig && canExecuteLanguage(langConfig.id)) {
        const execConfig = langConfig.execution;
        suggestions.push({
          command: `${execConfig.command} ${currentFile}`,
          description: `Run ${langConfig.name} file`,
          category: 'language',
          confidence: 0.8
        });
      }
    }

    // AI command suggestions
    if (input.startsWith('/ai') || input.startsWith('ai')) {
      suggestions.push({
        command: '/ai explain this code',
        description: 'Ask AI to explain selected code',
        category: 'system',
        confidence: 0.9
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  };

  // Handle tab completion
  const handleTabCompletion = async (input: string, term: Terminal, callback: (completion: string) => void) => {
    const suggestions = await generateCommandSuggestions(input);
    
    if (suggestions.length === 1) {
      callback(suggestions[0].command);
      updateTerminalDisplay(term, suggestions[0].command, suggestions[0].command.length);
    } else if (suggestions.length > 1) {
      term.writeln('');
      suggestions.forEach(suggestion => {
        term.writeln(`  \x1b[36m${suggestion.command}\x1b[0m - ${suggestion.description}`);
      });
      writePrompt(term);
      term.write(input);
    }
  };

  // Navigate command history
  const navigateHistory = (direction: number, term: Terminal, callback: (command: string) => void) => {
    if (commandHistory.length === 0) return;

    const newIndex = Math.max(-1, Math.min(commandHistory.length - 1, historyIndex + direction));
    setHistoryIndex(newIndex);

    const command = newIndex === -1 ? '' : commandHistory[commandHistory.length - 1 - newIndex];
    callback(command);
    updateTerminalDisplay(term, command, command.length);
  };

  // Execute command
  const executeCommand = async (command: string, term: Terminal) => {
    setIsExecuting(true);

    try {
      // Handle special AI commands
      if (command.startsWith('/ai ')) {
        await handleAICommand(command.slice(4), term);
        return;
      }

      // Handle language-specific execution
      if (currentFile && isLanguageExecutionCommand(command)) {
        await executeLanguageCommand(command, term);
        return;
      }

      // Handle basic commands (simulated for demo)
      await executeBasicCommand(command, term);

    } catch (error) {
      term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
    } finally {
      setIsExecuting(false);
      writePrompt(term);
    }
  };

  // Handle AI commands
  const handleAICommand = async (query: string, term: Terminal) => {
    term.writeln(`\x1b[33m🤖 AI Assistant:\x1b[0m Analyzing "${query}"...`);
    
    try {
      // Use command runner agent for terminal commands
      const result = await agentManager.runCommand(query, {
        currentFile,
        workingDirectory,
        language: currentFile ? getLanguageByFilename(currentFile)?.id : undefined
      });

      term.writeln('');
      term.writeln('\x1b[36m' + result.explanation + '\x1b[0m');
      
      if (result.suggestedCommands && result.suggestedCommands.length > 0) {
        term.writeln('');
        term.writeln('\x1b[32mSuggested commands:\x1b[0m');
        result.suggestedCommands.forEach((cmd, index) => {
          term.writeln(`  ${index + 1}. \x1b[33m${cmd}\x1b[0m`);
        });
      }

      if (result.safetyWarning) {
        term.writeln('');
        term.writeln(`\x1b[31m⚠️  ${result.safetyWarning}\x1b[0m`);
      }

    } catch (error) {
      term.writeln(`\x1b[31m❌ AI Error: ${error}\x1b[0m`);
    }
  };

  // Check if command is language execution
  const isLanguageExecutionCommand = (command: string): boolean => {
    if (!currentFile) return false;
    
    const langConfig = getLanguageByFilename(currentFile);
    if (!langConfig || !canExecuteLanguage(langConfig.id)) return false;
    
    return command.includes(langConfig.execution.command) && command.includes(currentFile);
  };

  // Execute language-specific command
  const executeLanguageCommand = async (command: string, term: Terminal) => {
    const langConfig = getLanguageByFilename(currentFile!);
    if (!langConfig) return;

    term.writeln(`\x1b[33m🚀 Executing ${langConfig.name} code...\x1b[0m`);
    
    // In a real implementation, this would execute via WebContainer or server
    // For demo purposes, we'll simulate execution
    const output = await simulateExecution(command, langConfig);
    
    term.writeln('');
    term.writeln(output);
    
    if (onCommandExecuted) {
      onCommandExecuted(command, output);
    }
  };

  // Execute basic commands (simulated)
  const executeBasicCommand = async (command: string, term: Terminal) => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case 'ls':
        term.writeln('📁 src/\n📁 public/\n📄 package.json\n📄 README.md');
        break;
      case 'pwd':
        term.writeln(workingDirectory);
        break;
      case 'clear':
        term.clear();
        return; // Don't write prompt again
      case 'echo':
        term.writeln(args.join(' '));
        break;
      case 'date':
        term.writeln(new Date().toString());
        break;
      case 'whoami':
        term.writeln('developer');
        break;
      default:
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
          // Send to real execution service
          webSocket.send(JSON.stringify({ command, cwd: workingDirectory }));
        } else {
          term.writeln(`\x1b[31mCommand not found: ${cmd}\x1b[0m`);
        }
    }
  };

  // Simulate code execution (replace with real execution in production)
  const simulateExecution = async (command: string, langConfig: any): Promise<string> => {
    // This would be replaced with actual execution via WebContainer or server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (langConfig.id) {
      case 'python':
        return '✅ Python script executed successfully\nOutput: Hello, World!';
      case 'javascript':
        return '✅ Node.js script executed successfully\nOutput: Hello, World!';
      case 'typescript':
        return '✅ TypeScript compiled and executed successfully\nOutput: Hello, World!';
      default:
        return `✅ ${langConfig.name} execution completed`;
    }
  };

  // Connect to execution service (WebSocket)
  const connectToExecutionService = () => {
    // In production, connect to WebSocket endpoint for real command execution
    if (process.env.NODE_ENV === 'production') {
      try {
        const ws = new WebSocket('wss://your-execution-service.com/terminal');
        
        ws.onopen = () => {
          setIsConnected(true);
          console.log('Connected to execution service');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (terminal.current) {
            terminal.current.writeln(data.output);
            writePrompt(terminal.current);
          }
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          console.log('Disconnected from execution service');
        };
        
        setWebSocket(ws);
      } catch (error) {
        console.warn('Could not connect to execution service:', error);
      }
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-white text-sm font-medium">Smart Terminal</span>
          {currentFile && (
            <span className="text-gray-400 text-sm">• {currentFile}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isExecuting && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
              <span className="text-sm">Executing...</span>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </div>

      {/* Terminal Container */}
      <div ref={terminalRef} className="w-full h-96" />

      {/* Command Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 max-h-32 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                if (terminal.current) {
                  terminal.current.write('\x1b[2K\x1b[G');
                  writePrompt(terminal.current, false);
                  terminal.current.write(suggestion.command);
                  setCurrentCommand(suggestion.command);
                  setShowSuggestions(false);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-cyan-400 font-mono text-sm">{suggestion.command}</span>
                <span className="text-gray-400 text-xs">{suggestion.description}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                suggestion.category === 'language' ? 'bg-green-600' :
                suggestion.category === 'git' ? 'bg-orange-600' :
                suggestion.category === 'npm' ? 'bg-red-600' :
                'bg-blue-600'
              } text-white`}>
                {suggestion.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};