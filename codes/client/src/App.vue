<script setup lang="ts">
import { useAlertStore } from '@/stores';

const alertStore = useAlertStore();
</script>

<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <v-overlay
      :model-value="alertStore.loading"
      class="align-center justify-center"
      persistent
      :z-index="10000"
    >
      <v-progress-circular color="primary" indeterminate size="48" width="4" />
    </v-overlay>
  </v-app>
  
</template>

<style lang="less" scoped>

span {
  font-size: 18px;
  display: inline-block;
  margin: 20px;
}
</style>
