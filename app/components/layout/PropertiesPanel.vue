<script setup lang="ts">
import { computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, ListTodo, Settings } from 'lucide-vue-next';

// TOOL_CONFIGS importé comme valeur runtime
import { type AgentData, type TaskData, type ToolName, TOOL_CONFIGS } from '@/types/workflow';

const workflowStore = useWorkflowStore();

// Sélections réactives
const selectedBlock = computed(() =>
  workflowStore.blocks.find(b => b.id === workflowStore.selectedBlockId)
);

const isAgent = computed(() => selectedBlock.value?.type === 'agent');
const toolOptions = Object.keys(TOOL_CONFIGS) as ToolName[];

// Helper de mise à jour simple
const updateBlock = (updates: Partial<AgentData | TaskData>) => {
  if (!selectedBlock.value) return;
  workflowStore.updateBlock(selectedBlock.value.id, updates);
};

// Pour TaskData
const taskData = computed(() => !isAgent.value ? (selectedBlock.value?.data as TaskData) : null);
const currentTool = computed(() => taskData.value?.toolName || 'groq');
const currentConfig = computed(() => TOOL_CONFIGS[currentTool.value]);

const updateAnalysisConfig = (fieldName: string, value: string) => {
  if (!taskData.value) return;
  updateBlock({
    analysisConfig: {
      ...(taskData.value.analysisConfig || {}),
      [fieldName]: value
    }
  });
};
</script>

<template>
  <aside class="w-80 bg-sidebar border-l border-sidebar-border flex flex-col overflow-hidden">
    
    <!-- Bloc vide si aucun élément sélectionné -->
    <div v-if="!selectedBlock" class="flex-1 flex flex-col">
      <div class="p-4 border-b border-sidebar-border flex items-center gap-2">
        <Settings class="w-4 h-4 text-muted-foreground" />
        <h2 class="font-semibold text-foreground">Propriétés</h2>
      </div>
      <div class="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
        <div>
          <div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Settings class="w-6 h-6 opacity-50" />
          </div>
          <p class="text-sm">Sélectionnez un bloc pour modifier ses propriétés</p>
        </div>
      </div>
    </div>

    <!-- Bloc propriétés -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="p-4 border-b border-sidebar-border flex items-center gap-2">
        <Bot v-if="isAgent" class="w-4 h-4 text-(--agent-color)" />
        <ListTodo v-else class="w-4 h-4 text-(--task-color)" />
        <h2 class="font-semibold text-foreground">
          {{ isAgent ? 'Propriétés de l\'Agent' : 'Propriétés de la Tâche' }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">

        <!-- Agent -->
        <div v-if="isAgent" class="space-y-4">
          <div class="space-y-2">
            <Label>Nom</Label>
            <Input 
              :model-value="(selectedBlock.data as AgentData).name"
              @update:model-value="v => updateBlock({ name: v as string })"
              placeholder="Nom de l'agent..."
            />
          </div>

          <div class="space-y-2">
            <Label>Outil (sélection unique)</Label>
            <Select
              :model-value="(selectedBlock.data as AgentData).tools[0] || ''"
              @update:model-value="v => updateBlock({ tools: v ? [v as ToolName] : [] })"
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un outil..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tool in toolOptions" :key="tool" :value="tool">
                  {{ tool }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>System Prompt</Label>
            <Textarea 
              :model-value="(selectedBlock.data as AgentData).prompt"
              @update:model-value="v => updateBlock({ prompt: v as string })"
              placeholder="System prompt..."
              :rows="6"
            />
          </div>
        </div>

        <!-- Task -->
        <div v-else-if="taskData" class="space-y-4">
          <div class="space-y-2">
            <Label>Outil</Label>
            <Select 
              :model-value="currentTool"
              @update:model-value="v => updateBlock({ toolName: v as ToolName })"
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tool in toolOptions" :key="tool" :value="tool">
                  {{ tool }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="currentConfig.type === 'object' && currentConfig.fields">
            <div v-for="[fieldName, fieldConfig] in Object.entries(currentConfig.fields)" :key="fieldName" class="space-y-2 mt-4">
              <Label>{{ fieldConfig.label }}</Label>
              <Textarea 
                v-if="fieldConfig.type === 'textarea'"
                :model-value="(taskData.analysisConfig as any)?.[fieldName] || ''"
                @update:model-value="v => updateAnalysisConfig(fieldName, v as string)"
                :placeholder="fieldConfig.placeholder"
                :rows="3"
              />
              <Input 
                v-else
                :model-value="(taskData.analysisConfig as any)?.[fieldName] || ''"
                @update:model-value="v => updateAnalysisConfig(fieldName, v as string)"
                :placeholder="fieldConfig.placeholder"
              />
            </div>
          </div>

          <div v-else class="space-y-2">
            <Label>{{ currentConfig.label }}</Label>
            <Textarea 
              v-if="currentConfig.type === 'textarea'"
              :model-value="(taskData as any)[currentConfig.param] || ''"
              @update:model-value="v => updateBlock({ [currentConfig.param]: v })"
              :placeholder="currentConfig.placeholder"
              :rows="4"
            />
            <Input 
              v-else
              :model-value="(taskData as any)[currentConfig.param] || ''"
              @update:model-value="v => updateBlock({ [currentConfig.param]: v })"
              :placeholder="currentConfig.placeholder"
            />
          </div>
        </div>

      </div>
    </div>
  </aside>
</template>
