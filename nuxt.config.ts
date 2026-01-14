// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['./app/assets/css/main.css'],
  
  vite: {
   plugins: [
     tailwindcss(),
   ],
 },
 runtimeConfig: {
    // Clés privées (uniquement côté serveur)
    lmApiUrl: process.env.LM_API_URL,
    lmModel: process.env.LM_MODEL,
    weatherApiKey: process.env.WEATHER_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    groqApiUrl: process.env.GROQ_API_URL,
    groqModel: process.env.GROQ_MODEL,
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
    bytezKey: process.env.BYTEZ_KEY,
    // On peut aussi externaliser le modèle si on veut changer facilement
    bytezModel: "Qwen/Qwen3-4B"
  },

  modules: ['shadcn-nuxt', '@pinia/nuxt'],
   shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  }
})