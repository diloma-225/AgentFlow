// server/api/execute.post.ts
import { Tool, Agent, Task } from '../utils/core'; // Assure-toi que ces fichiers sont dans /server/api/
import { fetchTool, lmStudioTool, fileWriteTool, weatherTool, groqTool } from '../utils/tools';
import {bytezTool} from '../utils/Bytez';
import { 
  companyOverviewTool, 
  appendAnalysisTool, 
  incomeStatementTool, 
  balanceSheetTool, 
  earningTool, 
  getAnalysisFileTool, 
  newsSentimentTool 
} from '../utils/financeTools';

const toolsMap: Record<string, any> = {
    'fetch': fetchTool,
    'bytez': bytezTool,
    'lmStudio': lmStudioTool,
    'groq': groqTool,
    'writeFile': fileWriteTool,
    'weather': weatherTool,
    'companyOverview': companyOverviewTool,
    'incomeStatement': incomeStatementTool,
    'balanceSheet': balanceSheetTool,
    'earning': earningTool,
    'appendAnalysis': appendAnalysisTool,
    'getAnalysisFile': getAnalysisFileTool,
    'newsSentiment': newsSentimentTool
};

// Logique Crew adaptée pour Nuxt (Nitro)
class Crew {
    agents: any[];
    constructor(agents = []) {
        this.agents = agents;
    }
    
    async run(tasks: any[]) {
        const results = [];
        let lastResult: any = null;
        
        for (let i = 0; i < tasks.length; i++) {
            // Optionnel : Trouver l'agent par outil au lieu du modulo
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            
            // --- LOGIQUE D'INJECTION INTELLIGENTE ---

            // 1. Pour l'IA (Groq/Bytez) : On AJOUTE le résultat précédent au prompt
            if (['groq', 'bytez'].includes(toolName) && i > 0 && lastResult) {
                const resultStr = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
                tasks[i].input = `${tasks[i].input}\n\nContexte financier reçu :\n${resultStr}`;
            } 
            
            // 2. Pour l'ÉCRITURE (append/write) : On place le résultat dans la propriété .content
            else if (['appendAnalysis', 'writeFile'].includes(toolName) && lastResult) {
                if (typeof tasks[i].input === 'object' && tasks[i].input !== null) {
                    tasks[i].input.content = typeof lastResult === 'string' ? lastResult : JSON.stringify(lastResult);
                }
            } 

            // 3. POUR LES TOOLS DE FINANCE (incomeStatement, balanceSheet, etc.)
            // /!\ ON NE FAIT RIEN /!\ 
            // On laisse l'input d'origine (ex: 'AAPL') tel qu'il a été défini dans l'interface.
            
            try {
                console.log(`[EXEC] Tâche ${i+1}: ${toolName} avec input:`, tasks[i].input);
                
                lastResult = await agent.perform(tasks[i]);
                results.push(lastResult);
            } catch (error: any) {
                throw new Error(`Erreur Agent ${agent.name} -> Tool ${toolName}: ${error.message}`);
            }
        }
        return results;
    }
}

export default defineEventHandler(async (event) => {
    // Lecture du body (remplace req.body)
    const body = await readBody(event);
    const { workflow } = body;
    
    try {
        // 1. Création des agents
        const agents = workflow.agents.map((agentData: any) => {
            const tools = agentData.tools.map((t: string) => toolsMap[t]).filter(Boolean);
            return new Agent(agentData.name, tools, agentData.prompt);
        });
        
        // 2. Création des tâches
        const tasks = workflow.tasks.map((taskData: any) => {
            return new Task(taskData.input, taskData.toolName);
        });
        
        // 3. Exécution
        const crew = new Crew(agents);
        const results = await crew.run(tasks);
        
        return { success: true, results };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});