<template>
    <v-dialog :model-value="modelValue" persistent max-width="784" @update:model-value="emit('update:modelValue', $event)">
        <v-card class="rounded-xl" v-if="!wordPack">
            <v-card-title class="d-flex align-center">
                <v-icon icon="mdi-package-variant" class="mr-3"></v-icon>
                Import Word Pack
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

                <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false);">
                    Cancel
                </v-btn>

                <v-btn color="primary" variant="flat" prepend-icon="mdi-download" :loading="loading" :disabled="!normalizedId" @click="loadWordPack">
                    Load Word Pack
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- 导入成功后 -->
        <v-card class="rounded-xl d-flex flex-column" max-width="784" height="80vh" v-else>
            <v-card-title class="elevation-8">
                <v-alert v-if="wordPack" type="success" variant="outlined" class="mt-2" style="flex: 0 0 100px;">
                    <p>{{ wordPack.words?.length ?? 0 }} words in this pack.</p>
                </v-alert>
            
                <p style="font-size: 18px;">Configure the words settings as needed.</p>
                <v-divider class="border-opacity-75" width="70%"></v-divider>
            </v-card-title>

            <v-card-text class="px-5 pb-5 overflow-y-auto hide-scrollbar" style="flex: 1 1 auto; min-height: 0;">
                <v-card v-for="(word, index) in words" :key="index" variant="outlined" class="mb-4 rounded-lg" color="teal-darken-4">
                    <v-overlay :model-value="!word.ifLoad" class="align-center justify-center" contained persistent>
                        <div class="d-flex flex-column align-center justify-center" style="width: 100%; height: 100%;">
                            <p class="text-black mb-5" style="font-size: 20px;">Don't load this word</p>
                            <v-btn @click="word.ifLoad = true; word.confirmedDuplicateKey = null;" variant="tonal" prepend-icon="mdi-restore" color="deep-orange-accent-3" width="150" class="rounded-pill" stacked :disabled="loading">Restore</v-btn>
                        </div>
                    </v-overlay>

                    <v-card-text class="pa-4">
                        <!-- 每个词汇的顶部操作栏 -->
                        <div class="d-flex flex-column align-center mb-4">
                            <div style="width: 100%;" class="d-flex align-center">
                                <p class="text-subtitle-1 font-weight-bold"> Word {{ index + 1 }} </p>
                                
                                <v-spacer></v-spacer>
                                
                                <v-radio-group v-model="word.type" inline hide-details density="compact" class="mr-3 flex-grow-0" :disabled="loading">
                                    <v-radio label="Active" value="active"></v-radio>
                                    <v-radio label="Passive" value="passive"></v-radio>
                                </v-radio-group>
                                
                                <v-btn color="error" variant="tonal" width="40" height="40" min-width="40" rounded="lg" @click="word.ifLoad = false; word.confirmedDuplicateKey = null;" :disabled="loading">
                                    <v-icon icon="mdi-delete-outline"></v-icon>
                                </v-btn>
                            </div>
                            
                            <div v-if="needsDuplicateConfirmation(word)" style="width: 100%;" class="mt-3 d-flex align-center justify-center flex-wrap ga-2">
                                <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-alert-circle-outline" :disabled="loading" @click=" duplicateConfirmWord = word; duplicateConfirmOverlay = true;">
                                    Word already exists
                                </v-btn>
                            </div>
                            <div v-else>    
                                <v-btn v-if="wordStore.findWords(word.word, word.type).length > 0" class="ma-2" color="grey-darken-4" variant="tonal" size="small" :disabled="loading" @click="word.confirmedDuplicateKey = null;">
                                    <v-icon icon="mdi-label" start></v-icon>
                                    add anyway, click to cancel
                                </v-btn>
                            </div>
                        </div>

                        <v-textarea
                            v-model="word.word"
                            label="Word"
                            variant="outlined"
                            density="comfortable"
                            auto-grow
                            rows="1"
                            max-rows="3"
                            hide-details
                            class="mb-4"
                            :disabled="loading"
                        ></v-textarea>

                        <v-textarea
                            v-model="word.explanation"
                            label="Explanation"
                            variant="outlined"
                            density="comfortable"
                            auto-grow
                            rows="2"
                            max-rows="5"
                            hide-details
                            :disabled="loading"
                        ></v-textarea>

                        <v-btn height="25" class="mt-4" prepend-icon="mdi-arrow-up-thick" append-icon="mdi-arrow-down-thick" :disabled="loading" color="black" @click="swap(index)" block variant="outlined">Swap the front and back</v-btn>
                    </v-card-text>
                </v-card>

                <v-btn block color="teal-lighten-1" @click="addToNotebook" :disabled="!canAddToNotebook">{{canAddToNotebook ? 'Add to notebook' : 'there are conflicts'}}</v-btn>
            </v-card-text>
        </v-card>

        <v-overlay v-model="duplicateConfirmOverlay" class="align-center d-flex justify-center" contained persistent>
            <v-card width="60vw" max-width="700">
                <v-card-title style="font-size: 20px; color: grey;">"{{ duplicateConfirmWord?.word }}" has already been added.</v-card-title>

                <div class="my-4 pa-2 overflow-x-auto d-flex flex-nowrap hide-scrollbar">
                    <v-sheet v-for="(item, index) in currentDuplicateWords" :key="index" width="40%" height="25vh" class="flex-shrink-0 mr-4">
                        <p>Explanation {{ index + 1 }}</p>
                        <v-divider :thickness="1" color="info" class="my-2" ></v-divider>
                        <p style="white-space: pre-line;">{{ item.explanation }}</p>
                    </v-sheet>
                </div>

                <v-card-actions>
                    <v-btn color="light-green-darken-4" :disabled="loading" @click="confirmDuplicateImport">
                        Add Anyway
                    </v-btn>
                    <v-btn color="red-darken-4" :disabled="loading" @click="duplicateConfirmWord.ifLoad = false; duplicateConfirmWord.confirmedDuplicateKey = null; duplicateConfirmOverlay = false;">
                        Skip
                    </v-btn>
                    <v-btn :disabled="loading" @click="duplicateConfirmOverlay = false">
                        Cancel
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-overlay>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { axiosWrapper } from '@/utilities/axios-wrapper';
import { useWordStore } from '@/stores';

const wordStore = useWordStore();

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

const wordPackId = ref('');
const wordPack = ref(null);
const words = ref([]);
const errorMessage = ref('');
const loading = ref(false);
const duplicateConfirmOverlay = ref(false);
const duplicateConfirmWord = ref(null);

const currentDuplicateWords = computed(() => {
    if (!duplicateConfirmWord.value)
        return [];

    return wordStore.findWords(
        duplicateConfirmWord.value.word,
        duplicateConfirmWord.value.type
    );
});

function confirmDuplicateImport() {
    if (!duplicateConfirmWord.value)
        return;

    const normalizedWord = wordStore.normalizeInputText(duplicateConfirmWord.value.word).toLowerCase();

    duplicateConfirmWord.value.confirmedDuplicateKey =`${normalizedWord}::${duplicateConfirmWord.value.type}`;

    duplicateConfirmOverlay.value = false;
    duplicateConfirmWord.value = null;
}

const normalizedId = computed(() => {
    return wordPackId.value.trim();
});

async function loadWordPack() {
    if (!normalizedId.value || loading.value) {
        return;
    }

    loading.value = true;
    errorMessage.value = '';
    wordPack.value = null;

    try {
        wordPack.value = await axiosWrapper.get(`/wordpack/${encodeURIComponent(normalizedId.value)}`);
        words.value = wordPack.value.words.map(word => ({
            ...word,
            ifLoad: true,
            confirmedDuplicateKey: null,
        }));
    }
    catch (error) {
        errorMessage.value = error?.response?.data?.error || error?.message || 'Failed to load the word pack.';
    }
    finally {
        loading.value = false;
    }
}

function swap(index){
    const word = words.value[index];
    const temp = word.word;
    word.word = word.explanation;
    word.explanation = temp;
}

watch(
    () => props.modelValue,
    isOpen => {
        if (!isOpen) {
            wordPackId.value = '';
            wordPack.value = null;
            errorMessage.value = '';
            words.value = [];
            duplicateConfirmOverlay.value = false;
            duplicateConfirmWord.value = null;
        }
    }
);

async function addToNotebook() {
    const wordsToAdd = words.value.filter(word => word.ifLoad);

    if (wordsToAdd.length === 0)
        return;

    loading.value = true;

    try {
        await axiosWrapper.post('/word/add-batch', {
            "words": wordsToAdd,
            "notebook_id": wordStore.currentNotebook.id
        });

        await wordStore.fetchWords();
        emit('update:modelValue', false);
    }
    finally {
        loading.value = false;
    }
}

const canAddToNotebook = computed(() => {
    if (loading.value)
        return false;

    const wordsToAdd = words.value.filter(word => word.ifLoad);

    if (wordsToAdd.length === 0)
        return false;

    return wordsToAdd.every(word => {
        const hasValidContent =
            typeof word.word === 'string' &&
            word.word.trim().length > 0 &&
            typeof word.explanation === 'string' &&
            word.explanation.trim().length > 0 &&
            (word.type === 'active' || word.type === 'passive');

        return hasValidContent && !needsDuplicateConfirmation(word);
    });
});

function needsDuplicateConfirmation(word) {
    if (!word.ifLoad || !word.word || !word.type)
        return false;

    const normalizedWord = wordStore.normalizeInputText(word.word);

    const hasDuplicate = wordStore.findWords(normalizedWord, word.type).length > 0;

    if (!hasDuplicate)
        return false;

    const currentKey = `${normalizedWord.toLowerCase()}::${word.type}`;

    return word.confirmedDuplicateKey !== currentKey;
}
</script>

<style scoped lang="less">
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
}
</style>