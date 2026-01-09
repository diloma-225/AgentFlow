<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflowStore';
import { Button } from '@/components/ui/button';

import {
  Play,
  Trash2,
  Save,
  Upload,
  HelpCircle
} from 'lucide-vue-next';

/* STORE */
const {
  blocks,
  connections,
  clearWorkflow,
  loadWorkflow,
  addLog,
  setExecuting,
  executeWorkflow
} = useWorkflowStore();
const workflowStore = useWorkflowStore();

/* EXECUTE */
const handleExecute = async () => {
  if (blocks.length === 0) {
    alert('Ajoutez d’abord des agents et des tâches à votre workflow.');
    return;
  }

  setExecuting(true);
  addLog('info', 'Début de l’exécution du workflow...');

  setTimeout(() => {
    addLog('success', 'Workflow exécuté avec succès !');
    setExecuting(false);
    alert('Toutes les tâches ont été exécutées avec succès.');
  }, 2000); 
};

/* CLEAR */
const handleClear = () => {
  clearWorkflow();
  alert('Tous les blocs et connexions ont été supprimés.');
};

/* SAVE */
const handleSave = () => {
  const workflow = {
    blocks: workflowStore.blocks, 
    connections: workflowStore.connections,
    timestamp: new Date().toISOString()
  };

  console.log("Données sauvegardées :", workflow.blocks);

  try {
    const blob = new Blob(
      [JSON.stringify(workflow, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Workflow enregistré avec succès !');
  } catch (err) {
    console.error("Erreur lors de la génération du fichier JSON", err);
    alert('Erreur lors de l’enregistrement du workflow.');
  }
};

/* LOAD */
const handleLoad = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        loadWorkflow(data.blocks || [], data.connections || []);
        alert('Votre workflow a été restauré avec succès.');
      } catch {
        alert('Format de fichier de workflow invalide.');
      }
    };
    reader.readAsText(file);
  };

  input.click();
};
</script>

<template>
  <div class="h-14 px-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button class="bg-(--success) hover:bg-(--success) cursor-pointer text-white !p-4" @click="executeWorkflow">
        <Play class="w-4 h-4" />
        Exécuter
      </Button>

      <Button variant="outline" class="!p-4 hover:bg-accent/20 cursor-pointer" @click="handleClear">
        <Trash2 class="w-4 h-4" />
        Effacer
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="ghost" class="cursor-pointer" @click="handleSave">
        <Save class="w-4 h-4" />
        Enregistrer
      </Button>

      <Button variant="ghost" class="cursor-pointer" @click="handleLoad">
        <Upload class="w-4 h-4" />
        Charger
      </Button>

      <Button variant="ghost" class="cursor-pointer" size="icon-sm">
        <HelpCircle class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
