// server/utils/tools.ts

export const bytezTool = new Tool('bytez', async (input) => {
    const config = useRuntimeConfig();
    
    const BYTEZ_KEY = config.bytezKey;
    const MODEL = config.bytezModel || "Qwen/Qwen3-4B";

    console.log(`[BYTEZ] Prompt envoyé au modèle ${MODEL}`);

    const options = {
        method: "POST",
        headers: {
            "Authorization": BYTEZ_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: input }],
            temperature: 0.7,
            max_tokens: 2500
        })
    };

    try {
        const res = await fetch("https://api.bytez.com/models/v2/openai/v1/chat/completions", options);
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Bytez API Error: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        let result = data.choices?.[0]?.message?.content || "";

        // --- DEBUT DU FILTRAGE ---
        // Cette regex cherche <think>...</think> (incluant les retours à la ligne avec le flag 's')
        // et le remplace par une chaîne vide.
        // 1. On tente de supprimer les blocs bien fermés
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, "");

            // 2. On supprime tout ce qui reste après une balise <think> ouverte (cas de la coupure)
            result = result.replace(/<think>[\s\S]*/gi, "");

            result = result.trim();
        // --- FIN DU FILTRAGE ---
        
        console.log(`[BYTEZ] Réponse filtrée (${result.length} caractères)`);
        return result;

    } catch (err: any) {
        console.error(`[BYTEZ ERROR]`, err.message);
        throw new Error(`Échec de l'appel Bytez: ${err.message}`);
    }
});