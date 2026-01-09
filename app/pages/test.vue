<script setup lang="ts">
import { Toaster, toast } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";
</script>
<template>
  <button
    @click="
      toast.success('Execution Success!');
    "
  >
    Success
  </button>
  <button
    @click="
      toast.loading('Loading...');
    "
  >
    Loading
  </button>
  <button
    @click="
      toast.error('Execution Error!');
    "
  >
    Error
  </button>
  <Toaster />
</template>