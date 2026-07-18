<template>
    <v-dialog :model-value="modelValue" persistent max-width="860" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="notebook-dialog rounded-xl d-flex flex-column">
            <v-card-title class="d-flex align-center px-6 pt-5">
                <v-icon icon="mdi-notebook-multiple" color="indigo-darken-1" class="mr-3" />

                <div class="overflow-hidden">
                    <p class="text-h6 font-weight-bold mb-0">Notebooks</p>
                    <p class="text-body-2 text-medium-emphasis text-truncate mb-0"> Current notebook: {{ wordStore.currentNotebook?.name ?? 'None' }}</p>
                </div>

                <v-spacer />

                <v-btn icon="mdi-close" variant="text" :disabled="loading" @click="emit('update:modelValue', false);"/>
            </v-card-title>

            <v-divider class="mt-4" />

            <!-- 笔记本列表 -->
            <div v-if="mode === 'list'">
                <div class="d-flex align-center px-6 pt-5">
                    <div>
                        <p class="text-subtitle-1 font-weight-bold mb-0">
                            Choose a notebook
                        </p>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            Select the notebook you want to use.
                        </p>
                    </div>

                    <v-spacer />

                    <v-btn color="indigo-darken-1" variant="tonal" prepend-icon="mdi-plus" :disabled="loading" @click="openCreate">
                        New Notebook
                    </v-btn>
                </div>

                <v-card-text class="overflow-x-auto hide-scrollbar px-6 py-5" style="flex: 1 1 auto;">
                    <div class="d-flex flex-nowrap ga-4">
                        <div class="d-flex flex-column" v-for="notebook in wordStore.notebooks" :key="notebook.id">
                            <v-sheet width="250" min-width="250" height="210" rounded="xl" 
                                class="notebook-sheet position-relative pa-5 d-flex flex-column flex-shrink-0"
                                :class="{ 'current-notebook': notebook.id === wordStore.currentNotebook?.id }"
                                @click="selectNotebook(notebook)"
                            >
                                <v-icon icon="mdi-notebook" size="42" color="indigo-darken-1" class="mb-4"/>
    
                                <p class="text-h6 font-weight-bold text-truncate mb-2">{{ notebook.name }}</p>
    
                                <p class="text-body-2 text-medium-emphasis mb-0">{{ getWordCount(notebook.id) }} {{ getWordCount(notebook.id) === 1 ? 'word' : 'words' }}</p>
    
                                <v-spacer />
    
                                <v-chip v-if="notebook.id === wordStore.currentNotebook?.id" color="success" variant="tonal" prepend-icon="mdi-check" size="small" class="align-self-start">
                                    Current
                                </v-chip>
    
                                <p v-else class="text-caption text-medium-emphasis mb-0">Click to switch</p>
                            </v-sheet>
                            <v-btn v-if="notebook.name !== 'Default Notebook'" class="align-self-center mt-4" icon="mdi-delete-outline" color="error" variant="tonal" :disabled="loading || wordStore.notebooks.length <= 1" @click.stop="openDelete(notebook)"/>
                        </div>
                    </div>
                </v-card-text>
            </div>

            <!-- 新建 -->
            <div v-else-if="mode === 'create'">
                <v-card-text class="d-flex align-center px-8" style="flex: 1 1 auto;">
                    <div class="mx-auto" style="width: 100%; max-width: 560px;">
                        <p class="text-h6 font-weight-bold mb-4">Create a new notebook</p>

                        <v-text-field
                            v-model="newNotebookName"
                            label="Notebook name"
                            placeholder="Enter a name for the new notebook."
                            variant="outlined"
                            maxlength="64"
                            counter
                            autofocus
                            :disabled="loading"
                            @keyup.enter="createNotebook"
                        />
                    </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="px-6 py-4">
                    <v-btn variant="text" prepend-icon="mdi-arrow-left" :disabled="loading" @click="backToList">Back</v-btn>

                    <v-spacer />

                    <v-btn color="indigo-darken-1" variant="flat" prepend-icon="mdi-plus" :loading="loading" :disabled="!canCreate" @click="createNotebook">Create</v-btn>
                </v-card-actions>
            </div>

            <!-- 删除确认 -->
            <div v-else>
                <v-card-text class="d-flex align-center px-8" style="flex: 1 1 auto;">
                    <div class="mx-auto" style="width: 100%; max-width: 580px;">
                        <v-alert type="warning" variant="tonal" class="mb-6">
                            Deleting this notebook will also delete all words stored in it.
                        </v-alert>

                        <p class="text-h6 font-weight-bold mb-2">Delete “{{ notebookToDelete?.name }}”?</p>

                        <p class="text-body-2 text-medium-emphasis mb-5">Type the notebook name to confirm.</p>

                        <v-text-field
                            v-model="deleteConfirmation"
                            :label="notebookToDelete?.name"
                            variant="outlined"
                            autofocus
                            :disabled="loading"
                        />
                    </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="px-6 py-4">
                    <v-btn variant="text" prepend-icon="mdi-arrow-left" :disabled="loading" @click="backToList">Back</v-btn>

                    <v-spacer />

                    <v-btn color="error" variant="flat" prepend-icon="mdi-delete-outline" :loading="loading" :disabled="!canDelete" @click="deleteNotebook">Delete</v-btn>
                </v-card-actions>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { axiosWrapper } from '@/utilities/axios-wrapper';
import { useWordStore } from '@/stores';

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    notebookNumbers: {
        type: [Array, Object],
        default: () => []
    }
});

const emit = defineEmits(['update:modelValue']);

const wordStore = useWordStore();

const loading = ref(false);
const mode = ref('list');
const newNotebookName = ref('');
const notebookToDelete = ref(null);
const deleteConfirmation = ref('');

const canCreate = computed(() => newNotebookName.value.trim().length > 0 && !wordStore.notebooks.some(notebook => notebook.name === newNotebookName.value.trim()));
const canDelete = computed(() => notebookToDelete.value && deleteConfirmation.value.trim() === notebookToDelete.value.name);

function getWordCount(notebookId) {
    const numberList = Array.isArray(props.notebookNumbers) ? props.notebookNumbers : [];

    const item = numberList.find(item => item.notebook_id == notebookId);

    return Number(item?.word_count ?? 0);
}

async function selectNotebook(notebook) {
    if (loading.value)
        return;

    if (notebook.id === wordStore.currentNotebook?.id) {
        emit('update:modelValue', false);
        return;
    }

    loading.value = true;

    try {
        wordStore.currentNotebook = notebook;
        await wordStore.fetchWords();
        emit('update:modelValue', false);
    }
    finally {
        loading.value = false;
    }
}

function openCreate() {
    newNotebookName.value = '';
    mode.value = 'create';
}

async function createNotebook() {
    const name = newNotebookName.value.trim();

    if (!name || loading.value)
        return;

    loading.value = true;

    try {
        const newNotebook = await axiosWrapper.post('/notebook/create', { name });

        wordStore.notebooks.push(newNotebook);
        mode.value = 'list';
        newNotebookName.value = '';
    }
    finally {
        loading.value = false;
    }
}

function openDelete(notebook) {
    notebookToDelete.value = notebook;
    deleteConfirmation.value = '';
    mode.value = 'delete';
}

async function deleteNotebook() {
    if (!canDelete.value || loading.value)
        return;

    loading.value = true;

    try {
        const deletedId = notebookToDelete.value.id;

        await axiosWrapper.delete(`/notebook/remove/${deletedId}`);

        wordStore.notebooks = wordStore.notebooks.filter(
            notebook => notebook.id !== deletedId
        );

        if (wordStore.currentNotebook?.id === deletedId) {
            wordStore.currentNotebook = wordStore.notebooks[0];
            await wordStore.fetchWords();
        }

        backToList();
    }
    finally {
        loading.value = false;
    }
}

function backToList() {
    mode.value = 'list';
    newNotebookName.value = '';
    notebookToDelete.value = null;
    deleteConfirmation.value = '';
}

watch(
    () => props.modelValue,
    isOpen => {
        if (!isOpen)
            backToList();
    }
);
</script>

<style scoped lang="less">
.notebook-dialog {
    height: min(76vh, 680px);
    overflow: hidden;
}

.notebook-sheet {
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease;
}

.notebook-sheet:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
}

.current-notebook {
    border: 2px solid rgb(var(--v-theme-success));
    background: rgba(var(--v-theme-success), 0.06);
}

@media (width <= 784px) {
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
        
        &::-webkit-scrollbar {
            display: none;
        }
    }
}
</style>
