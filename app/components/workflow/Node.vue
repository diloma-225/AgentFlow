<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Bot, ListTodo, GripVertical } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import type { WorkflowBlock, AgentData, TaskData } from '@/types/workflow';
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

/* DRAG ENGINE */
const nodeRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const pos = ref({ x: props.block.position.x, y: props.block.position.y });

watch(() => props.block.position, (newPos) => {
  if (!isDragging.value) {
    pos.value = { ...newPos };
  }
}, { deep: true });

let offset = { x: 0, y: 0 };

const startDrag = (event: PointerEvent) => {
  if ((event.target as HTMLElement).closest('button') || 
      (event.target as HTMLElement).classList.contains('connection-point')) {
    return;
  }

  isDragging.value = true;
  selectBlock(props.block.id);
  offset.x = event.clientX - pos.value.x;
  offset.y = event.clientY - pos.value.y;
  nodeRef.value?.setPointerCapture(event.pointerId);
  document.addEventListener('pointermove', onDrag);
  document.addEventListener('pointerup', stopDrag);
};

const onDrag = (event: PointerEvent) => {
  if (!isDragging.value) return;
  pos.value = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  moveBlock(props.block.id, { ...pos.value });
};

const stopDrag = (event: PointerEvent) => {
  isDragging.value = false;
  document.removeEventListener('pointermove', onDrag);
  document.removeEventListener('pointerup', stopDrag);
  nodeRef.value?.releasePointerCapture(event.pointerId);
};

/* COMPUTED DATA */
const isAgent = computed(() => props.block.type === 'agent');
const isSelected = computed(() => selectedBlockId?.value === props.block.id);
const data = computed(() => props.block.data);

const preview = computed(() => {
  if (isAgent.value) {
    const agentData = data.value as AgentData;
    return agentData.prompt?.substring(0, 40) + '...' || 'No prompt';
  } else {
    const taskData = data.value as TaskData;
    const toolName = taskData.toolName || 'groq';
    return `${toolName}`;
  }
});
</script>

<template>
<div
    ref="nodeRef"
    :class="cn(
      'absolute min-w-[200px] rounded-xl border-2 select-none bg-card',
      isDragging ? 'cursor-grabbing z-[100] scale-[1.02] shadow-lg' : 'cursor-grab',
      isSelected ? 'z-10 border-blue-400' : 'z-1 border-gray-300'
    )"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    @pointerdown="startDrag"
  >
    <!-- Header simple -->
    <div class="flex items-center justify-between px-3 py-2 rounded-t-[10px] bg-gray-600">
      <div class="flex items-center gap-2">
        <GripVertical class="w-4 h-4 text-white/70" />
        <Bot v-if="isAgent" class="w-4 h-4 text-white" />
        <ListTodo v-else class="w-4 h-4 text-white" />
        <span class="font-medium text-sm text-white">
          {{ isAgent ? (data as AgentData).name : 'Task' }}
        </span>
      </div>

      <button
        class="p-1 rounded hover:bg-white/20 transition-colors"
        @click.stop="deleteBlock(block.id)"
      >
        <X class="w-3 h-3 text-white" />
      </button>
    </div>

    <!-- Contenu simple -->
    <div class="px-3 py-2 relative overflow-hidden">
      <p class="text-xs text-muted-foreground line-clamp-2">
        {{ preview }}
      </p>
    </div>

    <!-- Points de connexion simples -->
    <div
      class="connection-point absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 bg-gray-300 cursor-pointer"
      @pointerdown.stop
      @click.stop="emit('start-connection', block.id)"
    />
    <div
      class="connection-point absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-gray-300 cursor-pointer"
      @pointerdown.stop
      @click.stop="emit('end-connection', block.id)"
    />
  </div>
</template>
