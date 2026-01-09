import fs from 'node:fs/promises';
import path from 'node:path';
import { Tool } from './core';

// Accès aux variables d'environnement via Nuxt
const config = useRuntimeConfig();

const LM_API_URL = config.lmApiUrl || process.env.LM_API_URL;
const LM_MODEL = config.lmModel || process.env.LM_MODEL;
const WEATHER_API_KEY = config.weatherApiKey || process.env.WEATHER_API_KEY;
const GROQ_API_KEY = config.groqApiKey || process.env.GROQ_API_KEY;
const GROQ_API_URL = config.groqApiUrl || process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = config.groqModel || process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

// --- OUTILS IA ---

export const lmStudioTool = new Tool('lmStudio', async (input) => {
    const config = useRuntimeConfig();
    
    // 1. Récupération avec une valeur de secours ou une chaîne vide
    const LM_API_URL = config.lmApiUrl || process.env.LM_API_URL;
    const LM_MODEL = config.lmModel || process.env.LM_MODEL || 'local-model';

    // 2. Vérification de sécurité (Type Guard)
    if (!LM_API_URL) {
        throw new Error("L'URL de LM Studio (LM_API_URL) n'est pas configurée dans le fichier .env");
    }

    const messages = [{ role: 'user', content: input }];

    // 3. Ici, TypeScript sait que LM_API_URL est forcément une string
    const res = await fetch(LM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            model: LM_MODEL, 
            messages,
            temperature: 0.7 
        })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
});

export const groqTool = new Tool('groq', async (input) => {
    const messages = [{ role: "user", content: input }];
    console.log(`[GROQ] prompt sent : ${input.substring(0, 50)}...`);

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({ model: GROQ_MODEL, messages })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
});

// --- OUTILS SYSTÈME & WEB ---

export const fetchTool = new Tool('fetch', async (url) => {
    console.log(`[FETCH] Calling API: ${url}`);
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 AgentFlow/1.0' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const html = await response.text();
        const articleMatches = html.match(/<div class="article-info"[\s\S]*?<\/div>/gi) || [];
        
        return articleMatches.join('\n')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .trim();
    } catch (error: any) {
        console.error('[FETCH] Erreur:', error.message);
        return '';
    }
});

export const fileWriteTool = new Tool('writeFile', async ({ filename, content }: any) => {
    // Utilisation de process.cwd() pour écrire à la racine du projet Nuxt
    const filePath = path.join(process.cwd(), filename);
    console.log(`[WRITE FILE] Writing to: ${filePath}`);

    await fs.writeFile(filePath, content, 'utf8');
    return `File written: ${filename}`;
});

export const weatherTool = new Tool('weather', async (city) => {
    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(`Weather API Error: ${data.error.message}`);

    return `Météo à ${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}.`;
});