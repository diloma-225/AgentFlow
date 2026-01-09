<script setup lang="ts">
import { ref } from 'vue';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Trash2
} from 'lucide-vue-next';

import { useWorkflowStore } from '@/stores/workflowStore';

const isExpanded = ref(false);
const workflowStore = useWorkflowStore();

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getLogColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-success';
    case 'error':
      return 'text-destructive';
    case 'warning':
      return 'text-yellow-500';
    default:
      return 'text-muted-foreground';
  }
};
</script>

<template>
  <div
    :class="[
      'fixed bottom-0 left-64 right-80 bg-card border-t border-border transition-all duration-300 z-50',
      isExpanded ? 'h-48' : 'h-10'
    ]"
  >
    <!-- Header -->
    <div
      class="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-2">
        <Terminal class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium text-muted-foreground">Console</span>

        <span
          v-if="workflowStore.logs.length > 0"
          class="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
        >
          {{ workflowStore.logs.length }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isExpanded"
          class="p-1 rounded hover:bg-muted"
          @click.stop="workflowStore.clearLogs()"
        >
          <Trash2 class="w-3 h-3" />
        </button>

        <ChevronDown
          v-if="isExpanded"
          class="w-4 h-4 text-muted-foreground"
        />
        <ChevronUp
          v-else
          class="w-4 h-4 text-muted-foreground"
        />
      </div>
    </div>

    <!-- Logs -->
    <div
      v-if="isExpanded"
      class="h-[calc(100%-2.5rem)] overflow-y-auto px-4 py-2 font-mono text-xs space-y-1"
    >
      <div
        v-if="workflowStore.logs.length === 0"
        class="text-muted-foreground opacity-50"
      >
        Pas encore de logs...
      </div>

      <div
        v-for="log in workflowStore.logs"
        :key="log.id"
        class="flex gap-3"
      >
        <span class="text-muted-foreground/50">
          [{{ formatTime(log.timestamp) }}]
        </span>
        <span :class="getLogColor(log.type)">
          {{ log.message }}
        </span>
      </div>
    </div>
  </div>
</template>
