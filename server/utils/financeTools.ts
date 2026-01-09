import fs from 'node:fs/promises';
import path from 'node:path';
import { Tool } from './core';

// Nuxt accède aux variables d'environnement via runtimeConfig ou process.env côté serveur
const config = useRuntimeConfig();
const ALPHA_VANTAGE_API_KEY = config.alphaVantageApiKey || process.env.ALPHA_VANTAGE_API_KEY;

// Définition du dossier de cache à la racine du projet
const CACHE_DIR = path.join(process.cwd(), 'server-cache');

// Utilitaire pour gérer le cache
async function getFromCacheOrFetch(symbol: string, suffix: string, apiUrl: string) {
    const cacheFile = path.join(CACHE_DIR, `${symbol}-${suffix}.json`);
    
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const cached = await fs.readFile(cacheFile, 'utf8');
        console.log(`[Tool] ✅ Cache hit: ${symbol} (${suffix})`);
        return JSON.parse(cached);
    } catch {
        console.log(`[Tool] 🌐 API fetch: ${symbol} (${suffix})`);
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        // On traite les données selon le type (quarterlyReports ou feed)
        let result = data;
        if (data.quarterlyReports) result = data.quarterlyReports.slice(0, 3);
        if (data.quarterlyEarnings) result = data.quarterlyEarnings.slice(0, 3);
        if (data.feed) result = data.feed.map((item: any) => ({ title: item.title, summary: item.summary }));

        await fs.writeFile(cacheFile, JSON.stringify(result, null, 2), 'utf8');
        return result;
    }
}

// --- EXPORT DES OUTILS ---

export const companyOverviewTool = new Tool('companyOverview', async (symbol: string) => {
    if (!symbol) throw new Error('Ticker symbol is required');
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return await getFromCacheOrFetch(symbol, 'overview', url);
});

export const incomeStatementTool = new Tool('incomeStatement', async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return await getFromCacheOrFetch(symbol, 'income', url);
});

export const balanceSheetTool = new Tool('balanceSheet', async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return await getFromCacheOrFetch(symbol, 'balance', url);
});

export const earningTool = new Tool('earning', async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return await getFromCacheOrFetch(symbol, 'earning', url);
});

export const newsSentimentTool = new Tool('newsSentiment', async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=25&tickers=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return await getFromCacheOrFetch(symbol, 'news', url);
});

export const appendAnalysisTool = new Tool('appendAnalysis', async ({ ticker, analysisType, content }: any) => {
    if (!ticker || !analysisType) throw new Error('ticker et analysisType requis');
    const filename = path.join(process.cwd(), `analysis-${ticker.toLowerCase()}.md`);
    const section = `## ${analysisType}\n${content || ''}\n\n`;
    await fs.appendFile(filename, section, 'utf8');
    return `Section "${analysisType}" ajoutée à ${filename}`;
});

export const getAnalysisFileTool = new Tool('getAnalysisFile', async (ticker: string) => {
    const filename = path.join(process.cwd(), `analysis-${ticker.toLowerCase()}.md`);
    try {
        return await fs.readFile(filename, 'utf8');
    } catch {
        throw new Error(`Impossible de lire le fichier : ${filename}`);
    }
});