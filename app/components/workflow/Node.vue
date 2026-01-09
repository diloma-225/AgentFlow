<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Bot, ListTodo, GripVertical } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import type { WorkflowBlock, AgentData, TaskData } from '@/types/workflow';
import { TOOL_CONFIGS } from '@/types/workflow';
import { useWorkflowStore } from '@/stores/workflowStore';
import { storeToRefs } from 'pinia';


/* PROPS & EMITS */
interface Props {
  block: WorkflowBlock;
  isConnecting: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'start-connection', blockId: string): void;
  (e: 'end-connection', blockId: string): void;
}>();

/* STORE */
const store = useWorkflowStore();
const { selectedBlockId } = storeToRefs(store);
const { selectBlock, deleteBlock, moveBlock } = store;

const { executingBlockId, failedBlockId } = storeToRefs(store);

const isActive = computed(() => executingBlockId.value === props.block.id);
const hasError = computed(() => failedBlockId.value === props.block.id);

/* CUSTOM DRAG ENGINE */
const nodeRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);

// Position locale réactive pour un rendu ultra-fluide
const pos = ref({ x: props.block.position.x, y: props.block.position.y });

// On synchronise la position locale si le store change (ex: via un bouton "reset")
watch(() => props.block.position, (newPos) => {
  if (!isDragging.value) {
    pos.value = { ...newPos };
  }
}, { deep: true });

// Stockage interne de l'écart (ne nécessite pas d'être réactif)
let offset = { x: 0, y: 0 };

const startDrag = (event: PointerEvent) => {
  // On ignore si on clique sur un bouton ou un point de connexion
  if ((event.target as HTMLElement).closest('button') || 
      (event.target as HTMLElement).classList.contains('connection-point')) {
    return;
  }

  isDragging.value = true;
  selectBlock(props.block.id);

  // Calcul du décalage initial curseur/boîte
  offset.x = event.clientX - pos.value.x;
  offset.y = event.clientY - pos.value.y;

  // Capture du pointeur (essentiel pour ne pas perdre la box en bougeant vite)
  nodeRef.value?.setPointerCapture(event.pointerId);

  // Ajout des listeners sur le document pour la fluidité
  document.addEventListener('pointermove', onDrag);
  document.addEventListener('pointerup', stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value) return;

  // Nouvelle position soustraite de l'offset
  const newX = event.clientX - offset.x;
  const newY = event.clientY - offset.y;

  pos.value = { x: newX, y: newY };

  // Mise à jour immédiate du store pour les flèches de connexion
  moveBlock(props.block.id, { x: newX, y: newY });
};

const stopDrag = (event: PointerEvent) => {
  isDragging.value = false;
  document.removeEventListener('pointermove', onDrag);
  document.removeEventListener('pointerup', stopDrag);
  
  if (nodeRef.value && event.pointerId !== undefined) {
    nodeRef.value.releasePointerCapture(event.pointerId);
  }
};

/* COMPUTED DATA */
const isAgent = computed(() => props.block.type === 'agent');
const isSelected = computed(() => selectedBlockId?.value === props.block.id);
const data = computed(() => props.block.data);

const preview = computed(() => {
  if (isAgent.value) {
    const agentData = data.value as AgentData;
    return agentData.prompt?.substring(0, 40) + '...' || 'No prompt';
  }
  const taskData = data.value as TaskData;
  const toolName = taskData.toolName || 'groq';
  const config = TOOL_CONFIGS[toolName];
  const value = taskData[config?.param as keyof TaskData];
  return typeof value === 'string' && value ? `${toolName}: ${value.substring(0, 30)}...` : `${toolName}: (Aucun paramètre)`;
});
</script>

<template>
<div
    ref="nodeRef"
    :class="cn(
      // Base et Transition
      'absolute min-w-[200px] rounded-xl border-2 select-none  bg-card',
      
      // États de Drag & Drop et Sélection
      isDragging ? 'cursor-grabbing z-[100] scale-[1.02] shadow-2xl' : 'cursor-grab',
      isSelected ? 'z-10' : 'z-1',

      // GESTION DES COULEURS DE BORDURE ET GLOW
      hasError 
        ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' // État Erreur
        : isActive 
          ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] scale-[1.05] z-50' // État Actif
          : isAgent 
            ? (isSelected ? 'border-(--agent-color) shadow-(--agent-glow)' : 'border-(--agent-color)/30 hover:border-(--agent-color)')
            : (isSelected ? 'border-(--task-color) shadow-(--task-glow)' : 'border-(--task-color)/30 hover:border-(--task-color)')
    )"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    @pointerdown="startDrag"
  >
    <div
      class="flex items-center justify-between px-3 py-2 rounded-t-[10px] transition-colors duration-500"
      :style="(!isActive && !hasError) ? {
        background: isAgent
          ? 'linear-gradient(135deg, hsl(186 100% 50%), hsl(186 80% 35%))'
          : 'linear-gradient(135deg, hsl(270 60% 55%), hsl(270 50% 40%))'
      } : {}"
      :class="{
        'bg-red-500': hasError,
        'bg-emerald-500': isActive
      }"
    >
      <div class="flex items-center gap-2">
        <GripVertical class="w-4 h-4 text-white/70" />
        
        <AlertCircle v-if="hasError" class="w-4 h-4 text-white" />
        <Loader2 v-else-if="isActive" class="w-4 h-4 text-white animate-spin" />
        <Bot v-else-if="isAgent" class="w-4 h-4 text-white" />
        <ListTodo v-else class="w-4 h-4 text-white" />

        <span class="font-medium text-sm text-white">
          {{ hasError ? 'Erreur' : (isActive ? 'Traitement...' : (isAgent ? (data as AgentData).name : 'Task')) }}
        </span>
      </div>

      <button
        class="p-1 rounded hover:bg-white/20 transition-colors"
        @click.stop="deleteBlock(block.id)"
      >
        <X class="w-3 h-3 text-white" />
      </button>
    </div>

    <div class="px-3 py-2 relative overflow-hidden">
      <div v-if="isActive" class="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
      
      <p class="text-xs text-muted-foreground line-clamp-2">
        {{ preview }}
      </p>
    </div>

    <div
      class="connection-point absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 z-20"
      :class="cn(
        isAgent ? 'bg-(--agent-color) border-(--agent-glow)' : 'bg-(--task-color) border-(--task-glow)',
        'hover:scale-125',
        isConnecting && 'animate-pulse scale-110'
      )"
      @pointerdown.stop
      @click.stop="emit('start-connection', block.id)"
    />

    <div
      class="connection-point absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 z-20"
      :class="cn(
        'bg-background hover:scale-125',
        isAgent ? 'border-(--agent-color) hover:bg-(--agent-color)' : 'border-(--task-color) hover:bg-(--task-color)'
      )"
      @pointerdown.stop
      @click.stop="emit('end-connection', block.id)"
    />
  </div>
</template>