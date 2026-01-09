/**
 * Un outil (Tool) enveloppe une fonction asynchrone spécifique.
 */
export class Tool {
    name: string;
    func: (input: any) => Promise<any>;

    constructor(name: string, func: (input: any) => Promise<any>) {
        this.name = name;
        this.func = func;
    }

    async execute(input: any) {
        return await this.func(input);
    }
}

/**
 * Un Agent utilise ses outils pour accomplir des tâches.
 */
export class Agent {
    name: string;
    tools: Tool[];
    prompt: string;

    constructor(name: string, tools: Tool[] = [], prompt: string = "") {
        this.name = name;
        this.tools = tools;
        this.prompt = prompt;
    }

    async perform(task: { toolName: string; input: any }, onProgress: any = null) {
        const tool = this.tools.find(t => t.name === task.toolName);

        if (!tool) {
          throw new Error(`Outil ${task.toolName} non trouvé pour l'agent ${this.name}`);
        }

        try {
            // Si l'outil est une IA (Groq/LM Studio), on lui injecte le prompt de l'agent.
            // Pour les outils "techniques" (File, Weather), on garde l'input pur.
            let finalInput = task.input;
            
            if (['groq', 'lmStudio'].includes(tool.name)) {
                const inputContent = typeof task.input === 'object' ? JSON.stringify(task.input) : task.input;
                finalInput = `Instructions de l'agent: ${this.prompt}\n\nTâche à accomplir: ${inputContent}`;
            }

            const result = await tool.execute(finalInput);
            return result;
        } catch (error: any) {
            throw new Error(`Erreur Agent ${this.name} -> Tool ${tool.name}: ${error.message}`);
        }
    }
}

/**
 * Une Task définit l'entrée et l'outil cible.
 */
export class Task {
    input: any;
    toolName: string;

    constructor(input: any, toolName: string) {
        this.input = input;
        this.toolName = toolName;
    }
}