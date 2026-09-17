<template>
	<v-overlay v-model="repeatConfirmDialog" class="repeat-confirm-overlay d-flex justify-center" contained persistent>
        <div class="repeat-confirm-wrapper">
            <v-card width="70vw" max-width="784" class="rounded-xl">
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
        </div>
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

.repeat-confirm-overlay {
    align-items: center;
}

.repeat-confirm-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
}

@media (max-width: 960px) {
    .repeat-confirm-overlay {
        align-items: flex-start !important;
    }

    .repeat-confirm-wrapper {
        margin-top: 30vh;
    }
}
</style>