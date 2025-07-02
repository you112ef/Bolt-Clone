import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Code, 
  Bug, 
  Wrench, 
  TestTube, 
  FolderPlus, 
  Terminal,
  Search,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { AgentManager } from '../agents/AgentManager';
import { ContextBuilder } from '../services/ContextBuilder';
import { AssistantMessage, AgentType } from '../types/agents';

interface AssistantPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  currentFile?: string;
  selectedText?: string;
  files?: any[];
}

export function AssistantPanel({ 
  isVisible, 
  onToggle, 
  currentFile, 
  selectedText,
  files 
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentManager = AgentManager.getInstance();
  const contextBuilder = ContextBuilder.getInstance();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      context: contextBuilder.buildContext({
        currentFile,
        selectedText,
        files,
        cursorPosition: { line: 0, column: 0 },
        openTabs: currentFile ? [currentFile] : []
      })
    };

         setMessages((prev: AssistantMessage[]) => [...prev, userMessage]);
     setInput('');
     setIsLoading(true);

     try {
       let response;
       
       if (selectedAgent) {
         // Use specific agent
         response = await agentManager.processRequest({
           type: selectedAgent,
           input,
           context: userMessage.context!
         });
       } else {
         // Let AI choose the best agent
         response = await agentManager.processNaturalLanguageRequest(
           input,
           userMessage.context!
         );
       }

       const assistantMessage: AssistantMessage = {
         id: (Date.now() + 1).toString(),
         role: 'assistant',
         content: response.success 
           ? formatAgentResponse(response)
           : `❌ ${response.error}\n\nSuggestions:\n${response.suggestions?.join('\n• ') || ''}`,
         timestamp: Date.now(),
         context: userMessage.context,
         actions: response.actions
       };

       setMessages((prev: AssistantMessage[]) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ An error occurred: ${error}`,
        timestamp: Date.now()
             };
       setMessages((prev: AssistantMessage[]) => [...prev, errorMessage]);
     } finally {
       setIsLoading(false);
       setSelectedAgent(null);
     }
   };

   const formatAgentResponse = (response: any): string => {
    if (!response.success) {
      return `❌ ${response.error}`;
    }

    const result = response.result;
    let formatted = '';

    // Format based on result type
    if (result.summary) {
      formatted += `## Summary\n${result.summary}\n\n`;
    }

    if (result.explanation) {
      formatted += `## Explanation\n${result.explanation.summary}\n\n`;
      
      if (result.explanation.patterns?.length > 0) {
        formatted += `### Patterns Detected\n${result.explanation.patterns.map((p: string) => `• ${p}`).join('\n')}\n\n`;
      }
    }

    if (result.bugs && result.bugs.length > 0) {
      formatted += `## Bugs Found (${result.bugs.length})\n`;
      result.bugs.forEach((bug: any, index: number) => {
        formatted += `### ${index + 1}. ${bug.description}\n`;
        formatted += `**Severity:** ${bug.severity}\n`;
        formatted += `**Line:** ${bug.line || 'Unknown'}\n`;
        formatted += `**Suggestion:** ${bug.suggestion}\n\n`;
      });
    }

    if (result.refactored) {
      formatted += `## Refactored Code\n\`\`\`\n${result.refactored}\n\`\`\`\n\n`;
      
      if (result.improvements?.length > 0) {
        formatted += `### Improvements Made\n${result.improvements.map((i: string) => `• ${i}`).join('\n')}\n\n`;
      }
    }

    if (result.testCode) {
      formatted += `## Generated Tests\n\`\`\`\n${result.testCode}\n\`\`\`\n\n`;
      formatted += `**Framework:** ${result.framework}\n`;
      formatted += `**Expected Coverage:** ${result.coverage}\n\n`;
    }

    if (result.projectStructure) {
      formatted += `## Project Structure\n${result.projectStructure.map((s: string) => `• ${s}`).join('\n')}\n\n`;
      
      if (result.instructions?.length > 0) {
        formatted += `### Setup Instructions\n${result.instructions.map((i: string) => `${i}`).join('\n')}\n\n`;
      }
    }

    if (result.analysis) {
      formatted += `## Command Analysis\n${result.analysis}\n\n`;
      
      if (result.suggestions?.length > 0) {
        formatted += `### Suggestions\n${result.suggestions.map((s: string) => `• ${s}`).join('\n')}\n\n`;
      }
    }

    return formatted || JSON.stringify(result, null, 2);
  };

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'explainer': return <Code className="w-4 h-4" />;
      case 'fixer': return <Bug className="w-4 h-4" />;
      case 'refactor': return <Wrench className="w-4 h-4" />;
      case 'test': return <TestTube className="w-4 h-4" />;
      case 'scaffold': return <FolderPlus className="w-4 h-4" />;
      case 'command': return <Terminal className="w-4 h-4" />;
      case 'search': return <Search className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const quickActions = [
    { type: 'explainer' as AgentType, label: 'Explain', icon: <Code className="w-4 h-4" /> },
    { type: 'fixer' as AgentType, label: 'Fix', icon: <Bug className="w-4 h-4" /> },
    { type: 'refactor' as AgentType, label: 'Refactor', icon: <Wrench className="w-4 h-4" /> },
    { type: 'test' as AgentType, label: 'Test', icon: <TestTube className="w-4 h-4" /> }
  ];

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-50"
        title="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`fixed right-4 bottom-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white p-1"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          {selectedText && (
            <div className="p-3 border-b border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Quick actions for selected code:</p>
              <div className="flex gap-2 flex-wrap">
                {quickActions.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => setSelectedAgent(action.type)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                      selectedAgent === action.type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <User className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Bot className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Bot className="w-6 h-6 text-green-400" />
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            {selectedAgent && (
              <div className="mb-2 flex items-center gap-2 text-xs text-blue-400">
                {getAgentIcon(selectedAgent)}
                Using {selectedAgent} agent
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your code..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}