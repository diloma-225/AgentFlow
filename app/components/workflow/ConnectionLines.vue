<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useWorkflowStore } from '@/stores/workflowStore';
import { storeToRefs } from 'pinia';

const store = useWorkflowStore();
// storeToRefs est CRUCIAL ici pour la réactivité initiale
const { blocks, connections } = storeToRefs(store);

const paths = computed(() => {
  if (!blocks.value?.length || !connections.value?.length) return [];

  return connections.value.map((conn) => {
    const fromBlock = blocks.value.find(b => b.id === conn.from);
    const toBlock = blocks.value.find(b => b.id === conn.to);

    if (!fromBlock || !toBlock) return null;

    // Points d'ancrage
    const x1 = (fromBlock.position?.x ?? 0) + 200;
    const y1 = (fromBlock.position?.y ?? 0) + 42;
    const x2 = (toBlock.position?.x ?? 0);
    const y2 = (toBlock.position?.y ?? 0) + 42;

    const dx = x2 - x1;
    const controlOffset = Math.min(Math.abs(dx) / 2, 120);

    return {
      id: conn.id,
      path: `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`,
      // On exporte les coordonnées pour le dégradé spécifique
      coords: { x1, y1, x2, y2 }
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);
});

</script>

<template>
<svg class="absolute inset-0 pointer-events-none overflow-visible w-full h-full" style="z-index: 0;">
    <defs>
      <linearGradient 
        v-for="item in paths" 
        :key="'grad-' + item.id"
        :id="'grad-' + item.id" 
        gradientUnits="userSpaceOnUse"
        :x1="item.coords.x1" 
        :y1="item.coords.y1"
        :x2="item.coords.x2" 
        :y2="item.coords.y2"
      >
        <stop offset="0%" stop-color="hsl(186 100% 50%)" />
        <stop offset="100%" stop-color="hsl(270 60% 55%)" />
      </linearGradient>

      <filter id="connectionGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g v-for="item in paths" :key="item.id">
      <path
        :d="item.path"
        fill="none"
        :stroke="`url(#grad-${item.id})`"
        stroke-width="6"
        opacity="0.15"
        stroke-linecap="round"
      />

      <path
        :d="item.path"
        fill="none"
        :stroke="`url(#grad-${item.id})`"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="8 4"
        class="animate-flow"
      />

<circle 
  v-if="item.path"
  r="4" 
  fill="hsl(186 100% 60%)" 
  filter="url(#connectionGlow)"
  style="visibility: hidden;" 
  onmouseenter="this.style.visibility='visible'" 
  onload="this.style.visibility='visible'"
>
  <animateMotion 
    dur="2.5s" 
    repeatCount="indefinite" 
    :path="item.path" 
    calcMode="linear"
  />
</circle>
    </g>
  </svg>
</template>

<style scoped>
.animate-flow {
  stroke-dashoffset: 100;
  animation: flow 3s linear infinite;
}
@keyframes flow {
  to { stroke-dashoffset: 0; }
}
</style>