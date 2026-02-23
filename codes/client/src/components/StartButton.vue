<template>
    <div>
        <v-btn :disabled="props.loading" :prepend-icon="preIcon" variant="text" @click="$emit('init')" :color="color">
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
    },
    loading: {
        type: Boolean,
        required: false,
        default: false
    }
});
</script>

<style lang="less" scoped>

</style>