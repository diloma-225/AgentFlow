<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflowStore';
import {Button} from '@/components/ui/button';

import {
  Play,
  Trash2,
  Save,
  Upload,
  HelpCircle
} from 'lucide-vue-next';

import { Toaster, toast } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";

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
    toast({
      message: 'Add some agents and tasks to your workflow first.',
      type: 'error',
       position: 'bottom-right',
    });
    return;
  }

  setExecuting(true);
  addLog('info', 'Starting workflow execution...');

  setTimeout(() => {
    addLog('success', 'Workflow executed successfully!');
    setExecuting(false);
     toast({
      message: 'All tasks completed successfully.',
      type: 'success',
       position: 'bottom-right',
    });
  }, 2000); 
};

/* CLEAR */
const handleClear = () => {
  clearWorkflow();
  toast({
      message: 'All blocks and connections have been removed.',
      type: 'success',
       position: 'bottom-right',
    });
};

/* SAVE */
const handleSave = () => {
  // 1. On récupère les données directement du store pour être sûr d'avoir les modifs
  const workflow = {
    blocks: workflowStore.blocks, 
    connections: workflowStore.connections,
    timestamp: new Date().toISOString()
  };

  // 2. Vérification de sécurité (optionnel)
  console.log("Données sauvegardées :", workflow.blocks);

  // 3. Création du JSON
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

    // Ton toast personnalisé
    alert('Workflow enregistré avec succès !');
  } catch (err) {
    console.error("Erreur lors de la génération du fichier JSON", err);
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
        toast({
          message: 'Your workflow has been restored.',
          type: 'success',
           position: 'bottom-right',
        });
      } catch {
        toast({
          message: 'Invalid workflow file format.',
          type: 'error',
            position: 'bottom-right',
        });
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
      <Button class="bg-(--success) hover:bg-(--success)  cursor-pointer text-white !p-4" @click="executeWorkflow">
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
  <Toaster />
</template>
<style>
  .VueHotToast__toast{
    background-color: var(--card);
    color: var(--foreground);
    border: 1px solid var(--border);
  }
</style>