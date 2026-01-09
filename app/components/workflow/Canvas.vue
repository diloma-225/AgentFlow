<script setup lang="ts">
import { ref } from 'vue';
import { useWorkflowStore } from '@/stores/workflowStore';
import { storeToRefs } from 'pinia';
import ConnectionLines from './ConnectionLines.vue';

/* STORE */
const store = useWorkflowStore();
const { blocks } = storeToRefs(store);
const { addConnection } = store;

/* REFS & STATE */
const containerRef = ref<HTMLDivElement | null>(null);
const isConnecting = ref(false);
const connectStart = ref<string | null>(null);

/* HANDLERS */
const handleStartConnection = (blockId: string) => {
  isConnecting.value = true;
  connectStart.value = blockId;
};

const handleEndConnection = (blockId: string) => {
  if (
    isConnecting.value &&
    connectStart.value &&
    connectStart.value !== blockId
  ) {
    addConnection(connectStart.value, blockId);
  }

  isConnecting.value = false;
  connectStart.value = null;
};

const handleCanvasClick = () => {
  if (isConnecting.value) {
    isConnecting.value = false;
    connectStart.value = null;
  }
};
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex-1 overflow-auto workflow-canvas"
    @click="handleCanvasClick"
  >
    <!-- Ambient glow effect -->
    <div
      class="absolute inset-0 pointer-events-none opacity-30 content"
    />

    <ConnectionLines />

    <WorkflowNode
      v-for="block in blocks"
      :key="block.id"
      :block="block"
      :is-connecting="isConnecting"
      @start-connection="handleStartConnection"
      @end-connection="handleEndConnection"
    />

    <div
      v-if="blocks.length === 0"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="text-center text-(muted-foreground) animate-pulse-glow">
        <div class="text-6xl mb-4 opacity-30">🤖</div>
        <p class="text-lg font-medium">
          Commencer par ajouter un Agent ou une Tâche
        </p>
        <p class="text-sm opacity-60">
          Utilisez la sidebar pour créer votre premier bloc de workflow
        </p>
      </div>
    </div>
  </div>
</template>
<style>
  :root {
    /* Couleurs inspirées de ton projet */
    --bg-color: #020617;        /* Fond très sombre (slate-950) */
    --dot-color: #1e293b;       /* Couleur des points (slate-800) */
    --glow-color: #06b6d4;      /* Cyan pour le halo */
  }

  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    background-color: var(--bg-color);
  }

  /* Le Canvas du Workflow */
  .workflow-canvas {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    
    /* Génération de la grille de points */
    background-image: radial-gradient(
      var(--dot-color) 1.5px, 
      transparent 0
    );
    background-size: 24px 24px;
    background-position: center center;
  }

  /* L'effet de lumière ambiante (Glow) */
  .workflow-canvas::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 30%, 
      rgba(6, 182, 212, 0.08), 
      transparent 60%
    );
    z-index: 1;
  }

  /* Texte d'exemple pour vérifier la visibilité */
  .content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: white;
    font-family: sans-serif;
    opacity: 0.5;
  }
</style>