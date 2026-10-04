<template>
    <v-dialog :model-value="modelValue" persistent max-width="784" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="rounded-xl" v-if="!wordPack">
            <v-card-title class="d-flex align-center mb-3">
                <v-icon icon="mdi-package-variant" class="mr-3"></v-icon>
                Import Word Pack

                <v-spacer />
                <v-btn icon="mdi-close" variant="text" :disabled="loading" @click="emit('update:modelValue', false);"></v-btn>
            </v-card-title>

            <v-card-subtitle>
                Enter the ID of the word pack you want to import.
            </v-card-subtitle>

            <v-card-text class="pt-5">
                <v-text-field
                    v-model="wordPackId"
                    label="Word Pack ID"
                    placeholder="xxxxxxxxxxxxxxxx"
                    prepend-inner-icon="mdi-identifier"
                    variant="outlined"
                    clearable
                    autofocus
                    :disabled="loading"
                    :error-messages="errorMessage ? [errorMessage] : []"
                    @keyup.enter="loadWordPack"
                ></v-text-field>
            </v-card-text>

            <v-card-actions class="px-6 pb-5">
                <v-spacer></v-spacer>

                <v-btn color="primary" variant="flat" prepend-icon="mdi-download" :loading="loading" :disabled="!normalizedId" @click="loadWordPack">
                    Load Word Pack
                </v-btn>
            </v-card-actions>
        </v-card>

        <WordImportReview v-else :source-words="wordPack.words" :existing-words="wordStore.words"
            :loading="loading" @cancel="emit('update:modelValue', false)" @submit="addToNotebook" />
    </v-dialog>
    <v-snackbar :model-value="!!submitError" @update:model-value="submitError = ''">{{ submitError }}</v-snackbar>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import WordImportReview from './WordImportReview.vue';
import { axiosWrapper } from '@/utilities/axios-wrapper';
import { useAlertStore, useWordStore } from '@/stores';

const wordStore = useWordStore();
const alertStore = useAlertStore();
const props = defineProps({ modelValue: { type: Boolean, required: true } });
const emit = defineEmits(['update:modelValue']);
const wordPackId = ref('');
const wordPack = ref(null);
const errorMessage = ref('');
const submitError = ref('');
const loading = computed(() => alertStore.loading);
const normalizedId = computed(() => wordPackId.value.trim());
async function loadWordPack() {
    if (!normalizedId.value || loading.value) return;
    errorMessage.value = '';
    try {
        wordPack.value = await axiosWrapper.get(`/wordpack/${encodeURIComponent(normalizedId.value)}`);
    } catch (error) {
        errorMessage.value = String(error?.message || error || 'Failed to load the word pack.');
    }
}
watch(() => props.modelValue, isOpen => {
    if (!isOpen) {
        wordPackId.value = '';
        wordPack.value = null;
        errorMessage.value = '';
    }
});
async function addToNotebook(words) {
    if (loading.value || !wordStore.currentNotebook) return;
    try {
        await axiosWrapper.post('/word/add-batch', { words, notebook_id: wordStore.currentNotebook.id });
        await wordStore.fetchNotebookAndWords();
        emit('update:modelValue', false);
    } catch (error) {
        submitError.value = String(error?.message || error || 'Failed to add words.');
    }
}
</script>
