import { defineStore } from 'pinia';
import type { WorkflowBlock, Connection, LogEntry, AgentData, TaskData, ToolName } from '@/types/workflow';
import { TOOL_CONFIGS } from '@/types/workflow';
import { ref } from 'vue';
import { Toaster, toast } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";

export const useWorkflowStore = defineStore('workflow', () => {
  // --- ÉTAT (STATE) ---
  const blocks = ref<WorkflowBlock[]>([]);
  const connections = ref<Connection[]>([]);
  const selectedBlockId = ref<string | null>(null);
  const logs = ref<LogEntry[]>([]);
  const isExecuting = ref(false);
  const blockCounter = ref(0);
  const executingBlockId = ref<string | null>(null);
  const failedBlockId = ref<string | null>(null); // Nouveau

  // --- TES FONCTIONS ORIGINALES (LOGIQUE MÉTIER) ---

  function validateTaskParameters(block: WorkflowBlock) {
    const data = block.data as any;
    const { toolName } = data;
    const config = TOOL_CONFIGS[toolName as ToolName];
    if (!config) return { valid: true };
    
    // Validation pour les outils financiers avec ticker
    if (['companyOverview', 'incomeStatement', 'balanceSheet', 'earning', 'getAnalysisFile', 'newsSentiment'].includes(toolName)) {
        const ticker = data[config.param];
        if (!ticker || !ticker.trim()) {
            return { valid: false, message: `${config.label} requis pour ${toolName}` };
        }
    }
    
    // Validation pour appendAnalysis
    if (toolName === 'appendAnalysis') {
        const analysisConfig = data[config.param];
        if (!analysisConfig || !analysisConfig.ticker || !analysisConfig.ticker.trim()) {
            return { valid: false, message: 'Ticker requis pour appendAnalysis' };
        }
        if (!analysisConfig.analysisType || !analysisConfig.analysisType.trim()) {
            return { valid: false, message: 'Type d\'analyse requis pour appendAnalysis' };
        }
    }
    
    // Validation pour les autres outils
    if (['fetch', 'weather', 'writeFile', 'bytez'].includes(toolName)) {
        const value = data[config.param];
        if (!value || !value.trim()) {
            return { valid: false, message: `${config.label} requis pour ${toolName}` };
        }
    }
    
    return { valid: true };
  }

  function formatTaskForExecution(taskData: any) {
    const { toolName } = taskData;
    const inputs: Record<string, any> = {
        fetch: taskData.url,
        weather: taskData.city,
        writeFile: { filename: taskData.filename, content: '' },
        lmStudio: taskData.input || '',
        bytez: taskData.input || '',
        groq: taskData.input || '',
        companyOverview: taskData.ticker,
        incomeStatement: taskData.ticker,
        balanceSheet: taskData.ticker,
        earning: taskData.ticker,
        newsSentiment: taskData.ticker,
        appendAnalysis: taskData.analysisConfig || {},
        getAnalysisFile: taskData.ticker
    };
    return { input: inputs[toolName] || inputs.lmStudio, toolName };
  }

  async function executeWorkflow() {
  if (!blocks.value.length) return alert('Aucun bloc à exécuter !');

  // 1. Reset des états
  clearLogs();
  failedBlockId.value = null;
  executingBlockId.value = null;
  addLog('info', 'Démarrage du workflow...');

  // 2. Validation des paramètres des tâches
  for (const block of blocks.value.filter(b => b.type === 'task')) {
    const validation = validateTaskParameters(block);
    if (!validation.valid) {
      failedBlockId.value = block.id; // On marque le bloc en erreur
      addLog('error', `Erreur de validation: ${validation.message}`);
      return alert(`Erreur: ${validation.message}`);
    }
  }

  addLog('info', `Validation réussie - ${blocks.value.filter(b => b.type === 'agent').length} agents, ${blocks.value.filter(b => b.type === 'task').length} tâches`);

  // 3. Préparation des données pour l'API
  const workflow = {
    agents: blocks.value.filter(b => b.type === 'agent').map(b => b.data),
    tasks: blocks.value.filter(b => b.type === 'task').map(b => formatTaskForExecution(b.data))
  };

  isExecuting.value = true;

  try {
    addLog('info', 'Envoi de la requête au serveur...');
    
    // Appel API (On attend la réponse globale)
    const response = await $fetch<any>('/api/execute', {
      method: 'POST',
      body: { workflow }
    });

    if (response.success) {
      // 4. Animation séquentielle des blocs
      // On parcourt tous les blocs pour simuler le passage de l'IA sur chaque étape
      for (const block of blocks.value) {
        executingBlockId.value = block.id;
        // On attend 800ms par bloc pour que l'utilisateur voit l'effet visuel
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      executingBlockId.value = null; // On éteint le dernier bloc
      addLog('success', 'Workflow exécuté avec succès !');

      // Traitement des logs de résultats
      response.results.forEach((res: any, i: number) => {
        const resStr = typeof res === 'string' ? res : JSON.stringify(res);
        addLog('info', `Résultat étape ${i + 1}: ${resStr.substring(0, 100)}...`);
      });

      toast({
        message: 'Workflow exécuté avec succès !',
        type: 'success',
        position: 'bottom-right',
      });

    } else {
      // Gestion d'une erreur renvoyée par le serveur (ex: erreur LLM)
      // On essaie de cibler le bloc qui a échoué (souvent le dernier)
      const lastBlock = blocks.value[blocks.value.length - 1];
      failedBlockId.value = lastBlock?.id || null;
      
      addLog('error', `Erreur serveur: ${response.error}`);
      alert('Erreur: ' + response.error);
    }

  } catch (error: any) {
    // 5. Gestion des erreurs de connexion/crash
    failedBlockId.value = executingBlockId.value; // Le bloc en cours passe en rouge
    addLog('error', `Erreur de connexion: ${error.message}`);
    alert('Erreur de connexion: ' + error.message);
  } finally {
    isExecuting.value = false;
    executingBlockId.value = null;
  }
}

/*   async function executeWorkflow() {
    if (!blocks.value.length) return alert('Aucun bloc à exécuter!');
    
    clearLogs();
    addLog('info', 'Démarrage du workflow...');
    
    // Validation
    for (const block of blocks.value.filter(b => b.type === 'task')) {
        const validation = validateTaskParameters(block);
        if (!validation.valid) {
            addLog('error', `Erreur: ${validation.message}`);
            return alert(`Erreur: ${validation.message}`);
        }
    }
    
    addLog('info', `Validation réussie - ${blocks.value.filter(b => b.type === 'agent').length} agents, ${blocks.value.filter(b => b.type === 'task').length} tâches`);
    
    const workflow = {
        agents: blocks.value.filter(b => b.type === 'agent').map(b => b.data),
        tasks: blocks.value.filter(b => b.type === 'task').map(b => formatTaskForExecution(b.data))
    };
    
    isExecuting.value = true; // Remplace progressContainer.style.display
    
    try {
        addLog('info', 'Envoi de la requête au serveur...');
        const response = await $fetch<any>('/api/execute', {
            method: 'POST',
            body: { workflow }
        });
        
        setTimeout(() => {
            isExecuting.value = false;
            
            if (response.success) {
                addLog('success', 'Workflow exécuté avec succès!');
                response.results.forEach((res: any, i: number) => {
                    const resStr = typeof res === 'string' ? res : JSON.stringify(res);
                    addLog('info', `Étape ${i + 1}: ${resStr.substring(0, 100)}...`);
                });
                toast({
                  message: 'Workflow exécuté avec succès!',
                  type: 'success',
                  position: 'bottom-right',
                });
            } else {
                addLog('error', `Erreur: ${response.error}`);
                alert('Erreur: ' + response.error);
            }
        }, 2000);
        
    } catch (error: any) {
        isExecuting.value = false;
        addLog('error', `Erreur de connexion: ${error.message}`);
        alert('Erreur de connexion: ' + error.message);
    }
  } */

  // --- ACTIONS DE BASE DU STORE ---

  const addBlock = (type: 'agent' | 'task', position?: { x: number; y: number }) => {
    const newId = `${type}_${blockCounter.value}`;
    const stackIndex = blocks.value.length; 
    const defaultPosition = position || {
      x: 150 + (stackIndex * 40) % 300,
      y: 150 + (stackIndex * 40) % 300
    };

    const newBlock: WorkflowBlock = {
      id: newId,
      type,
      position: defaultPosition,
      data: type === 'agent'
        ? { name: `Agent ${blockCounter.value}`, tools: ['bytez'], prompt: 'tu es un assistant IA utile.' }
        : { input: '', toolName: 'bytez' }
    };

    blocks.value.push(newBlock);
    blockCounter.value++;
    selectedBlockId.value = newId;
  };

  const updateBlock = (id: string, updates: Partial<AgentData | TaskData>) => {
    const block = blocks.value.find(b => b.id === id);
    if (block) {
      block.data = { ...block.data, ...updates } as any;
    }
  };

  const deleteBlock = (id: string) => {
    blocks.value = blocks.value.filter(b => b.id !== id);
    connections.value = connections.value.filter(c => c.from !== id && c.to !== id);
    if (selectedBlockId.value === id) selectedBlockId.value = null;
  };

  const moveBlock = (id: string, position: { x: number; y: number }) => {
    const block = blocks.value.find(b => b.id === id);
    if (block) block.position = position;
  };

  const selectBlock = (id: string | null) => {
    selectedBlockId.value = id;
  };

  const addConnection = (from: string, to: string) => {
    if (from === to || connections.value.some(c => c.from === from && c.to === to)) return;
    connections.value.push({ id: `conn_${Date.now()}`, from, to });
  };

  const deleteConnection = (id: string) => {
    connections.value = connections.value.filter(c => c.id !== id);
  };

  const clearWorkflow = () => {
    blocks.value = [];
    connections.value = [];
    selectedBlockId.value = null;
    blockCounter.value = 0;
  };

  const loadWorkflow = (loadedBlocks: WorkflowBlock[], loadedConnections: Connection[]) => {
    blocks.value = loadedBlocks;
    connections.value = loadedConnections;
    if (loadedBlocks.length > 0) {
      const ids = loadedBlocks.map(b => parseInt(b.id.split('_')[1] || '0'));
      blockCounter.value = Math.max(...ids, 0) + 1;
    }
    selectedBlockId.value = null;
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    logs.value.push({ id: `log_${Date.now()}`, type, message, timestamp: new Date() });
  };

  const clearLogs = () => { logs.value = []; };

  const setExecuting = (value: boolean) => { isExecuting.value = value; };

  return {
    blocks, connections, selectedBlockId, logs, isExecuting, blockCounter,
    addBlock, updateBlock, deleteBlock, moveBlock, selectBlock,
    addConnection, deleteConnection, clearWorkflow, loadWorkflow,
    addLog, clearLogs, setExecuting, executeWorkflow,
    validateTaskParameters, formatTaskForExecution, executingBlockId, failedBlockId // Exportées pour rester accessibles
  };
});