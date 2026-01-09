export type ToolName =
  | 'groq'
  | 'lmStudio'
  | 'fetch'
  | 'weather'
  | 'writeFile'
  | 'companyOverview'
  | 'incomeStatement'
  | 'balanceSheet'
  | 'earning'
  | 'newsSentiment'
  | 'appendAnalysis'
  | 'bytez'
  | 'getAnalysisFile';

export interface ToolConfig {
  param: string;
  placeholder: string;
  label: string;
  type?: 'text' | 'textarea' | 'object';
  default?: string;
  fields?: Record<string, {
    placeholder: string;
    label: string;
    type?: 'text' | 'textarea';
  }>;
}

export interface AgentData {
  name: string;
  tools: ToolName[];
  prompt: string;
}

export interface TaskData {
  input?: string;
  toolName: ToolName;
  url?: string;
  city?: string;
  filename?: string;
  ticker?: string;
  analysisConfig?: {
    ticker?: string;
    analysisType?: string;
    content?: string;
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface WorkflowBlock {
  id: string;
  type: 'agent' | 'task';
  data: AgentData | TaskData;
  position: Position;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface Workflow {
  blocks: WorkflowBlock[];
  connections: Connection[];
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

export const TOOL_CONFIGS: Record<ToolName, ToolConfig> = {
  fetch: { param: 'url', placeholder: 'https://example.com', label: 'URL' },
  weather: { param: 'city', placeholder: 'Paris', label: 'City' },
  writeFile: { param: 'filename', placeholder: 'output.txt', label: 'Filename', default: 'output.txt' },
  lmStudio: { param: 'input', placeholder: 'Vos instructions...', label: 'Prompt', type: 'textarea' },
  bytez: { 
    param: 'input', 
    placeholder: 'Vos instructions...', 
    label: 'Prompt', 
    type: 'textarea' 
  },
  groq: { param: 'input', placeholder: 'Vos instructions...', label: 'Prompt', type: 'textarea' },
  companyOverview: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' },
  incomeStatement: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' },
  balanceSheet: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' },
  earning: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' },
  newsSentiment: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' },
  appendAnalysis: {
    param: 'analysisConfig',
    placeholder: '',
    label: 'Configuration',
    type: 'object',
    fields: {
      ticker: { placeholder: 'AAPL', label: 'Ticker' },
      analysisType: { placeholder: 'Overview Analysis', label: 'Analysis Type' },
      content: { placeholder: 'Analysis content...', label: 'Content', type: 'textarea' }
    }
  },
  getAnalysisFile: { param: 'ticker', placeholder: 'AAPL', label: 'Ticker Symbol' }
};
