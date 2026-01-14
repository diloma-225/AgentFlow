<script setup lang="ts">
import { computed } from 'vue';
import { Bot, Layers } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/stores/workflowStore';

/* ACCÈS AU STORE */
const workflowStore = useWorkflowStore();

/* LOGIQUE (Calculées) */
const agentCount = computed(() => 
  workflowStore.blocks.filter(b => b.type === 'agent').length
);

const taskCount = computed(() => 
  workflowStore.blocks.filter(b => b.type === 'task').length
);

/* MÉTHODES */
const handleAddBlock = (type: 'agent' | 'task') => {
  workflowStore.addBlock(type);
};
</script>

<template>
  <aside class="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
    
    <div class="p-4 border-b border-sidebar-border">
      <div class="flex items-center gap-3">
        <div>
          <!-- <h1 class="font-semibold text-foreground">AgentFlow</h1> -->
          <p class="text-xs text-muted-foreground">Constructeur de workflows IA</p>
        </div>
      </div>
    </div>
    
    <div class="p-4 border-b border-sidebar-border">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Ajouter des nœuds
      </p>
      <div class="space-y-2">
        <Button
          id="addNewAgent"
          class="w-full justify-start gap-2 bg-gray-400 hover:bg-gray-500 text-white cursor-pointer"
          @click="handleAddBlock('agent')"
        >
          <Bot class="w-4 h-4" />
          Ajouter un Agent
        </Button>
        <Button
          id="addNewTask"
          class="w-full justify-start gap-2 bg-gray-400 hover:bg-gray-500 text-white cursor-pointer"
          @click="handleAddBlock('task')"
        >
          <Layers class="w-4 h-4" />
          Ajouter une Tâche
        </Button>
      </div>
    </div>
    
    <div class="p-4 border-b border-sidebar-border">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Stats
      </p>
      <div class="grid grid-cols-2 gap-2">
        <div class="p-3 rounded-lg bg-muted/50 border border-border">
          <div class="text-2xl font-bold text-gray-600">{{ agentCount }}</div>
          <div class="text-xs text-muted-foreground">Agents</div>
        </div>
        <div class="p-3 rounded-lg bg-muted/50 border border-border">
          <div class="text-2xl font-bold text-gray-600">{{ taskCount }}</div>
          <div class="text-xs text-muted-foreground">Tâches</div>
        </div>
      </div>
    </div>
    
    <div class="p-4 mt-auto">
      <div class="p-3 rounded-lg bg-muted/30 border border-border/50">
        <p class="text-xs text-muted-foreground">
          <span class="text-gray-600">●</span> Cliquez sur les points de connexion pour lier les nœuds
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          <span class="text-gray-600">●</span> Glissez les nœuds pour les repositionner
        </p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Suppression des gradients et glow */
#addNewAgent:hover,
#addNewTask:hover{
  box-shadow: none;
}
</style>
