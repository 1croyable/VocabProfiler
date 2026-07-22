<template>
	<v-overlay v-model="repeatConfirmDialog" class="align-center d-flex justify-center" contained persistent>
        <v-card width="70vw" max-width="784">
            <v-card-title style="font-size: 20px; color: grey;">"{{ duplicateWords[0]?.word }}" has already been added.</v-card-title>
            <div class="my-4 pa-2 overflow-x-auto d-flex flex-nowrap hide-scroll-bar">
                <v-sheet v-for="(item, index) in duplicateWords" :key="index" width="40%" height="25vh" class="flex-shrink-0 mr-4">
                    <p>Explanation {{ index + 1 }}</p>
                    <v-divider :thickness="1" class="my-1 border-opacity-100"></v-divider>
                    <p class="preserve-breaks">{{ item.explanation }}</p>
                </v-sheet>
            </div>
            <v-card-actions class="d-flex justify-center ga-10">
                <v-btn color="light-green-darken-2" @click="$emit('add')" :disabled="loading">
                    Add Anyway
                </v-btn>
                <v-btn color="red" @click="$emit('cancel')" :disabled="loading">
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-overlay>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	duplicateWords: {
		type: Array,
		required: true,
	},
	loading: {
		type: Boolean,
		default: false,
	}
});

const emit = defineEmits(['update:modelValue', 'add', 'cancel']);

const repeatConfirmDialog = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value),
});
</script>

<style lang="less" scoped>
.preserve-breaks {
    white-space: pre-line;
}
</style>