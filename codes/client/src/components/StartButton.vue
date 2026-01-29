<template>
    <div>
        <v-btn :prepend-icon="preIcon" variant="text" @click="$emit('init')" :color="color">
            <slot></slot>
        </v-btn>
    </div>
</template>

<script setup>

const props = defineProps({
    preIcon: {
        type: String,
        required: false,
        default: null
    },
    color: {
        type: String,
        required: false,
        default: "black"
    }
});
</script>

<style lang="less" scoped>

</style>