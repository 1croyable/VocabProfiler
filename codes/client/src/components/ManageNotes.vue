<template>
    <v-dialog :model-value="modelValue" persistent max-width="1040" scrollable
        @update:model-value="emit('update:modelValue', $event)">
        <v-card class="notes-dialog rounded-xl pb-6">
            <v-card-title class="d-flex align-center ga-3 px-5 pt-4">
                <v-icon icon="mdi-note-multiple-outline" color="amber-darken-3" />
                <span class="text-h6">Manage Notes</span>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" :disabled="alertStore.loading" aria-label="Close notes"
                    @click="emit('update:modelValue', false)" />
            </v-card-title>

            <v-card-text class="px-5">
                <div class="d-flex align-center justify-space-between mb-5 ga-3 flex-wrap">
                    <p class="text-body-2 text-medium-emphasis mb-0">Save words for later without adding them to your
                        review queue.</p>
                    <v-btn color="amber-darken-3" prepend-icon="mdi-plus" :disabled="alertStore.loading"
                        @click="createNote">New Note</v-btn>
                </div>

                <div v-if="pageNotes.length" class="notes-grid">
                    <v-card v-for="note in pageNotes" :key="note.id" class="note-tile rounded-lg pa-4"
                        variant="outlined" tabindex="0" @click="selectNote(note)" @keydown.enter="selectNote(note)">
                        <div class="d-flex align-start ga-2">
                            <v-icon icon="mdi-note-text-outline" color="amber-darken-3" class="mt-1" />
                            <div class="overflow-hidden flex-grow-1">
                                <p class="text-subtitle-1 font-weight-bold text-truncate mb-0" :title="note.name">{{
                                    note.name }}</p>
                                <p class="text-caption text-medium-emphasis mb-0">{{ Number(note.word_count) }} words
                                </p>
                            </div>
                            <v-menu>
                                <template #activator="{ props: menuProps }">
                                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text"
                                        density="comfortable" :disabled="alertStore.loading"
                                        :aria-label="`Actions for ${note.name}`" @click.stop @keydown.enter.stop />
                                </template>
                                <v-list density="compact">
                                    <v-list-item prepend-icon="mdi-pencil-outline" title="Rename"
                                        @click.stop="openRename(note)" />
                                    <v-list-item prepend-icon="mdi-content-copy" title="Apply to Notebook" :disabled="note.word_count === 0"
                                        @click.stop="openApply(note)" />
                                    <v-list-item prepend-icon="mdi-delete-outline" title="Delete" base-color="error"
                                        @click.stop="openDelete(note)" />
                                </v-list>
                            </v-menu>
                        </div>
                        <v-spacer />
                        <div class="d-flex ga-3 text-caption text-medium-emphasis">
                            <span>{{ Number(note.active_count) }} active</span>
                            <span>{{ Number(note.passive_count) }} passive</span>
                        </div>
                    </v-card>
                </div>
                <div v-else class="text-center text-medium-emphasis py-12">No notes yet. Create one to save words for
                    later.</div>
            </v-card-text>

            <v-card-actions v-if="pageCount > 1" class="justify-center pb-4">
                <v-pagination v-model="page" :length="pageCount" :total-visible="5" density="compact" />
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" persistent max-width="440">
        <v-card class="pa-4">
            <v-card-title>Rename Note</v-card-title>
            <v-card-text>
                <v-text-field v-model="newName" label="Note name" maxlength="64" counter autofocus
                    :disabled="alertStore.loading" @keyup.enter="renameNote" />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="alertStore.loading" @click="renameDialog = false">Cancel</v-btn>
                <v-btn color="primary" :disabled="!newName.trim() || alertStore.loading"
                    @click="renameNote">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="440">
        <v-card class="pa-4">
            <v-card-title>Delete Note?</v-card-title>
            <v-card-text>Delete “{{ selectedNote?.name }}” and its {{ Number(selectedNote?.word_count ?? 0) }} saved
                words?
                This cannot be undone.</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="alertStore.loading" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" :disabled="alertStore.loading" @click="deleteNote">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="applyDialog" persistent max-width="800">
        <v-card class="pa-4">
            <v-card-title>Apply to Notebook</v-card-title>
            <v-card-text>
                <p class="mb-4">Copy the words from “{{ selectedNote?.name }}” into a notebook.
                </p>
                <v-select v-model="targetNotebookId" :items="wordStore.notebooks" item-title="name" item-value="id"
                    label="Choose notebook" variant="outlined" :disabled="alertStore.loading || applying" />
                <p v-if="targetNotebookId" class="text-body-2">Confirm to review these words before adding them to “{{
                    wordStore.notebooks.find(item => item.id === targetNotebookId)?.name }}” for study. You can edit or skip conflicting words.</p>
            </v-card-text>
            <div class="d-flex justify-end px-2">
                <v-checkbox v-model="deleteAfterApply" density="compact" hide-details
                    class="delete-after-apply flex-grow-0" :disabled="alertStore.loading || applying">
                    <template #label>
                        <span class="text-caption">I also want to delete this note after applying it to the notebook.</span>
                    </template>
                </v-checkbox>
            </div>
            <v-card-actions>
                <v-spacer />
                <v-btn :disabled="alertStore.loading || applying" @click="applyDialog = false">Cancel</v-btn>
                <v-btn color="primary" :disabled="!targetNotebookId || alertStore.loading || applying"
                    @click="applyNote">Confirm</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="reviewDialog" persistent max-width="784">
        <WordImportReview :source-words="reviewWords" :existing-words="targetWords"
            :loading="alertStore.loading || applying" @cancel="reviewDialog = false" @submit="submitNote" />
    </v-dialog>

    <v-snackbar v-model="showResult" timeout="4000">{{ resultMessage }}</v-snackbar>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import WordImportReview from './WordImportReview.vue';
import { axiosWrapper } from '@/utilities/axios-wrapper';
import { useDisplay } from 'vuetify';
import { useAlertStore, useNoteStore, useWordStore } from '@/stores';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'select', 'deleted', 'applied']);
const noteStore = useNoteStore();
const wordStore = useWordStore();
const alertStore = useAlertStore();
const { smAndDown } = useDisplay();

const page = ref(1);
const pageSize = computed(() => smAndDown.value ? 4 : 9);
const pageCount = computed(() => Math.ceil(noteStore.notes.length / pageSize.value));
const pageNotes = computed(() => noteStore.notes.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const selectedNote = ref(null);
const renameDialog = ref(false);
const deleteDialog = ref(false);
const applyDialog = ref(false);
const reviewDialog = ref(false);
const reviewWords = ref([]);
const targetWords = ref([]);
const applying = ref(false);
const deleteAfterApply = ref(false);
const newName = ref('');
const targetNotebookId = ref(null);
const resultMessage = ref('');
const showResult = ref(false);

watch(() => props.modelValue, async isOpen => {
    if (isOpen) {
        page.value = 1;
        try { await noteStore.fetchNotes(); }
        catch (error) { showError('Could not load notes.'); }
    }
});
watch(pageCount, count => { if (page.value > count) page.value = Math.max(1, count); });

function showError(message) {
    resultMessage.value = message;
    showResult.value = true;
}

async function createNote() {
    if (alertStore.loading) return;
    try {
        await noteStore.createNote();
        page.value = Math.max(1, pageCount.value);
    } catch (error) { showError('Could not create note.'); }
}

async function selectNote(note) {
    if (alertStore.loading) return;
    try {
        await noteStore.selectNote(note);
        emit('select', note);
        emit('update:modelValue', false);
    } catch (error) { showError('Could not open note.'); }
}

function openRename(note) {
    selectedNote.value = note;
    newName.value = note.name;
    renameDialog.value = true;
}

async function renameNote() {
    if (!selectedNote.value || !newName.value.trim() || alertStore.loading) return;
    try {
        await noteStore.renameNote(selectedNote.value, newName.value.trim());
        renameDialog.value = false;
    } catch (error) { showError('Could not rename note.'); }
}

function openDelete(note) {
    selectedNote.value = note;
    deleteDialog.value = true;
}

async function deleteNote() {
    if (!selectedNote.value || alertStore.loading) return false;
    try {
        const deletedId = selectedNote.value.id;
        await noteStore.deleteNote(selectedNote.value);
        deleteDialog.value = false;
        emit('deleted', deletedId);
        return true;
    } catch (error) {
        showError('Could not delete note.');
        return false;
    }
}

function openApply(note) {
    selectedNote.value = note;
    targetNotebookId.value = null;
    deleteAfterApply.value = false;
    applyDialog.value = true;
}

async function applyNote() {
    if (!selectedNote.value || !targetNotebookId.value || alertStore.loading || applying.value) return;
    applying.value = true;
    try {
        // Fetch the chosen destination without replacing the current Pinia notebook or words.
        const [source, existing] = await Promise.all([
            axiosWrapper.get(`/notes/${selectedNote.value.id}/words`),
            axiosWrapper.get(`/word/list?notebook_id=${targetNotebookId.value}`),
        ]);
        reviewWords.value = source;
        targetWords.value = existing;
        applyDialog.value = false;
        reviewDialog.value = true;
    } catch (error) { showError('Could not load words for review.'); }
    finally { applying.value = false; }
}

async function submitNote(words) {
    if (!selectedNote.value || !targetNotebookId.value || alertStore.loading || applying.value) return;
    applying.value = true;
    try {
        const { added } = await noteStore.applyToNotebook(selectedNote.value, targetNotebookId.value, words);
        reviewDialog.value = false;
        const deleted = deleteAfterApply.value ? await deleteNote() : false;
        emit('applied', targetNotebookId.value);
        resultMessage.value = `${added} words added to the notebook.` + (deleteAfterApply.value
            ? (deleted ? ' Note deleted.' : ' Could not delete the note; it remains available.')
            : '');
        showResult.value = true;
    } catch (error) {
        showError('Could not apply note. Check conflicts and try again.');
        try { 
            targetWords.value = await axiosWrapper.get(`/word/list?notebook_id=${targetNotebookId.value}`);
        }
        catch { }
    } finally { applying.value = false; }
}

</script>

<style scoped>
.delete-after-apply {
    max-width: 100%;
}

.notes-dialog {
    height: min(85vh, 800px);
}

.notes-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.note-tile {
    min-width: 0;
    min-height: 126px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
}

.note-tile:hover,
.note-tile:focus-visible {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 16px rgba(0, 0, 0, .12);
}

@media (max-width: 720px) {
    .notes-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }
}

@media (max-width: 420px) {
    .notes-grid {
        grid-template-columns: 1fr;
    }
}
</style>
