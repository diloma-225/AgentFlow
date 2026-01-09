<script setup lang="ts">
// Nuxt 4 / VueUse Head pour SEO
definePageMeta({
  title: 'AgentFlow - AI Workflow Automation Platform',
  meta: [
    {
      name: 'description',
      content:
        'Build intelligent automation workflows with AI agents. Create, configure, and orchestrate automated tasks with our visual workflow builder.'
    }
  ]
});

import Sidebar from '@/components/layout/Sidebar.vue';
import Toolbar from '@/components/layout/Toolbar.vue';
import PropertiesPanel from '@/components/layout/PropertiesPanel.vue';
import Console from '@/components/layout/Console.vue';

</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Left Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <Toolbar />
      <WorkflowCanvas />
    </main>

    <!-- Right Panel -->
    <PropertiesPanel />

    <!-- Console -->
    <Console />
  </div>
</template>
