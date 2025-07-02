import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepsList } from '../components/StepsList.tsx';
import { FileExplorer } from '../components/FileExplorer';
import { SmartCodeEditor } from '../components/SmartCodeEditor.tsx';
import { AIAssistantPanel } from '../components/AIAssistantPanel.tsx';
import { SmartTerminal } from '../components/SmartTerminal.tsx';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types/index.ts';
import { AgentManager } from '../agents/AgentManager';
import axios from 'axios';
import { API_URL } from '../config.ts';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader.tsx';

import {
  Home,
  PanelRight,
  Send,
  RefreshCw,
  AlertTriangle,
  BoltIcon,
  Download,
  Terminal,
  Bot,
  Code,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebContainer } from '@webcontainer/api';
import { downloadProjectAsZip } from '../utils/fileDownloader';
import { useAppContext } from '../context/AppContext';

// Defining the step status type explicitly
type StepStatus = 'pending' | 'in-progress' | 'completed';

export function Builder() {
  const navigate = useNavigate();
  const {
    prompt,
    setLoading: setContextLoading,
    currentStep,
    setCurrentStep,
  } = useAppContext();
  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // AI Agents Integration
  const [agentManager] = useState(() => new AgentManager());
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  
  const {
    webcontainer,
    error: webContainerError,
    loading: webContainerLoading,
  } = useWebContainer();

  // Enhanced tab system for code, preview, terminal
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'terminal'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Process steps to generate files
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;

    steps
      .filter(({ status }) => status === 'pending')
      .forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? [];
          let currentFileStructure = [...originalFiles];
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: 'completed' as StepStatus,
          };
        })
      );
    }
  }, [steps]);

  // Update WebContainer when files change
  useEffect(() => {
    if (!webcontainer || files.length === 0) return;

    try {
      (webcontainer as WebContainer).mount(createMountStructure(files));
    } catch (err) {
      console.error('Error mounting files to WebContainer:', err);
    }
  }, [files, webcontainer]);

  // Enhanced file update with AI assistance
  const handleFileUpdate = async (updatedFile: FileItem) => {
    const updateFilesRecursively = (
      filesArray: FileItem[],
      fileToUpdate: FileItem
    ): FileItem[] => {
      return filesArray.map((file) => {
        if (file.path === fileToUpdate.path) {
          return fileToUpdate;
        } else if (file.type === 'folder' && file.children) {
          return {
            ...file,
            children: updateFilesRecursively(file.children, fileToUpdate),
          };
        }
        return file;
      });
    };

    const updatedFiles = updateFilesRecursively(files, updatedFile);
    setFiles(updatedFiles);

    // Update file in WebContainer
    if (webcontainer) {
      try {
        (webcontainer as WebContainer).fs.writeFile(
          updatedFile.path.startsWith('/')
            ? updatedFile.path.substring(1)
            : updatedFile.path,
          updatedFile.content || ''
        );
      } catch (err) {
        console.error('Error writing file to WebContainer:', err);
      }
    }

    // AI-powered analysis of changes
    if (agentManager && updatedFile.content) {
      try {
        const analysis = await agentManager.analyzeCode(updatedFile.content, updatedFile.name);
        if (analysis.issues.length > 0) {
          console.log('AI detected issues:', analysis.issues);
        }
      } catch (err) {
        console.error('AI analysis failed:', err);
      }
    }
  };

  // Create mount structure for WebContainer
  const createMountStructure = (files: FileItem[]): Record<string, any> => {
    const mountStructure: Record<string, any> = {};

    const processFile = (file: FileItem, isRootFolder: boolean) => {
      if (file.type === 'folder') {
        mountStructure[file.name] = {
          directory: file.children
            ? Object.fromEntries(
                file.children.map((child) => [
                  child.name,
                  processFile(child, false),
                ])
              )
            : {},
        };
      } else if (file.type === 'file') {
        if (isRootFolder) {
          mountStructure[file.name] = {
            file: {
              contents: file.content || '',
            },
          };
        } else {
          return {
            file: {
              contents: file.content || '',
            },
          };
        }
      }

      return mountStructure[file.name];
    };

    files.forEach((file) => processFile(file, true));

    return mountStructure;
  };

  async function init() {
    try {
      setLoading(true);

      if (!templateSet) {
        // Initialize AI Agents
        await agentManager.initialize();
        
        const response = await axios.post(`${API_URL}/template`, {
          prompt,
        });

        const { prompts, uiPrompts } = response.data;

        setLlmMessages([
          {
            role: 'user',
            content: prompt,
          },
        ]);

        const initialSteps = parseXml(uiPrompts[0] || '').map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps(initialSteps);
        setTemplateSet(true);

        const chatResponse = await axios.post(`${API_URL}/chat`, {
          messages: [...prompts, prompt].map((content: string) => ({
            role: 'user',
            content,
          })),
        });

        const newSteps = parseXml(chatResponse.data.response).map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        setSteps((prevSteps) => [...prevSteps, ...newSteps]);

        setLlmMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: chatResponse.data.response },
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing project:', error);
      setLoading(false);
    }
  }

  const handleRefreshWebContainer = () => {
    window.location.href = '/';
  };

  const handleDownloadProject = async () => {
    if (files.length > 0) {
      setIsDownloading(true);
      try {
        await downloadProjectAsZip(files);
      } catch (error) {
        console.error('Failed to download project:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  // Enhanced send message with AI routing
  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    const newUserMessage = {
      role: 'user' as const,
      content: userPrompt,
    };

    setLlmMessages([...llmMessages, newUserMessage]);
    setPrompt('');
    setLoading(true);

    try {
      // Use AI Agent for intelligent routing
      const agentResponse = await agentManager.routeQuery(userPrompt, {
        files,
        selectedFile,
        currentStep,
      });

      if (agentResponse.requiresCodeGeneration) {
        // Traditional bolt.diy flow for code generation
        const response = await axios.post(`${API_URL}/chat`, {
          messages: [...llmMessages, newUserMessage],
        });

        const assistantMessage = {
          role: 'assistant' as const,
          content: response.data.response,
        };

        setLlmMessages([...llmMessages, newUserMessage, assistantMessage]);

        const newSteps = parseXml(response.data.response).map((x: any) => ({
          ...x,
          status: 'pending' as StepStatus,
        }));

        if (newSteps.length > 0) {
          setSteps((prevSteps) => [...prevSteps, ...newSteps]);
        }
      } else {
        // Direct AI agent response
        const assistantMessage = {
          role: 'assistant' as const,
          content: agentResponse.response,
        };

        setLlmMessages([...llmMessages, newUserMessage, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (webcontainer && !templateSet) {
      init();
    }
  }, [webcontainer, templateSet]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Enhanced Header with AI Tools */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg==" 
              alt="Bolt Logo" 
              className="w-6 h-6 relative z-10" 
            />
            <h1 className="text-xl font-semibold text-white">Bolt</h1>
            </button>
          <div className="h-6 mx-4 border-r border-gray-700"></div>
          <h2 className="text-gray-300 hidden sm:block">AI-Powered App Builder</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              showAIAssistant 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:text-white'
            }`}
            title="Toggle AI Assistant"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* Terminal Toggle */}
          <button
            onClick={() => {
              setShowTerminal(!showTerminal);
              if (!showTerminal) setActiveTab('terminal');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              showTerminal 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:text-white'
            }`}
            title="Toggle Smart Terminal"
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          <button
            onClick={handleDownloadProject}
            disabled={isDownloading || files.length === 0}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mr-4 bg-gray-800 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download project as ZIP"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download ZIP</span>
              </>
            )}
          </button>
          <a
            href="/"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Keep existing */}
        <motion.div
          className="bg-gray-900 border-r border-gray-800 overflow-hidden"
          animate={{
            width: isSidebarCollapsed
              ? '3rem'
              : ['100%', '90%', '75%', '50%', '33%', '25rem'].length >
                window.innerWidth / 100
              ? '0'
              : '25rem',
          }}
          initial={false}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-full">
            <div className="p-2 bg-gray-900 border-r border-gray-800 flex flex-col items-center">
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={
                  isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                <PanelRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-800 p-4">
                  <h3 className="text-white font-medium mb-1">Your Prompt</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{prompt}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-white font-medium mb-4">Build Steps</h3>
                  <div className="max-h-full overflow-y-auto">
                    <StepsList
                      steps={steps}
                      currentStep={currentStep}
                      onStepClick={setCurrentStep}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-800 p-4">
                  {loading || !templateSet ? (
                    <Loader />
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">
                        Add Instructions
                      </h3>
                      <div className="relative">
                        <textarea
                          value={userPrompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Add more instructions or modifications..."
                          className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder-gray-500 text-sm h-20"
                        ></textarea>
                        <button
                          onClick={handleSendMessage}
                          disabled={userPrompt.trim().length === 0}
                          className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* File explorer - Keep existing */}
        <motion.div
          className="border-r border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
          animate={{
            width: isFileExplorerCollapsed ? '0' : '16rem',
            opacity: isFileExplorerCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-medium">Files</h3>
            <button
              onClick={() => setFileExplorerCollapsed(!isFileExplorerCollapsed)}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
            >
              <PanelRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>
        </motion.div>

        {/* Main content with enhanced tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Tab Header */}
          <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Code className="w-4 h-4" />
                Code
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              {showTerminal && (
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'terminal'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  Terminal
                </button>
              )}
            </div>

            {/* Error display */}
            {webContainerError && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  WebContainer Error - Please refresh
                </span>
                <button
                  onClick={handleRefreshWebContainer}
                  className="text-red-400 hover:text-red-300"
                  title="Refresh WebContainer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' && (
              <SmartCodeEditor
                file={selectedFile}
                onUpdateFile={handleFileUpdate}
                agentManager={agentManager}
                files={files}
              />
            )}
            {activeTab === 'preview' && (
              <PreviewFrame 
                webContainer={webcontainer as WebContainer}
                files={files}
              />
            )}
            {activeTab === 'terminal' && showTerminal && (
              <SmartTerminal 
                webcontainer={webcontainer}
                files={files}
                agentManager={agentManager}
              />
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <motion.div
            className="w-80 border-l border-gray-800 bg-gray-900"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3 }}
          >
            <AIAssistantPanel
              agentManager={agentManager}
              selectedFile={selectedFile}
              files={files}
              onFileUpdate={handleFileUpdate}
              onClose={() => setShowAIAssistant(false)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
