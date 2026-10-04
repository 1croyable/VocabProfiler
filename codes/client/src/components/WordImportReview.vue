<template>
    <v-card class="rounded-xl d-flex flex-column" max-width="784" height="80vh">
        <v-card-title class="elevation-8 d-flex flex-column align-center">
            <div style="width: 100%;" class="d-flex">
                <div class="d-flex align-center ga-4">
                    <v-chip color="teal-lighten-1" class="mb-2" style="font-size: 16px;">
                        <v-icon>mdi-check</v-icon>
                    </v-chip>
                    <p class="text-h6">{{ formattedSourceWords.length }} words to review.</p>
                </div>

                <v-spacer />

                <v-btn icon="mdi-close" variant="text" :disabled="loading" @click="emit('cancel');"/>
            </div>

            <v-divider class="border-opacity-100 mb-2" :thickness="1" width="120%"></v-divider>
            <p class="text-body-1 align-self-center text-cyan-darken-3">Edit or skip conflicts before adding words.</p>
        </v-card-title>

        <v-card-text class="px-5 pb-5 overflow-y-auto hide-scrollbar" style="flex: 1 1 auto; min-height: 0;">
            <v-card v-for="(word, index) in formattedSourceWords" :key="index" variant="outlined" class="mb-4 rounded-lg" color="teal-darken-4">
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

                        <!-- 来源批次内部有完全相同的卡片 -->
                        <div v-if="hasSourceExactDuplicate(word)" style="width: 100%;" class="mt-3 d-flex align-center justify-center flex-wrap ga-2">
                            <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-alert-circle-outline" :disabled="loading">
                                Identical word exists in selected batch — edit or skip
                            </v-btn>
                        </div>

                        <!-- 与目标笔记本中的词发生冲突 -->
                        <div v-else-if="needsDuplicateConfirmation(word)" style="width: 100%;" class="mt-3 d-flex align-center justify-center flex-wrap ga-2">
                            <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-alert-circle-outline" :disabled="loading" @click="duplicateConfirmWord = word; duplicateConfirmOverlay = true;">
                                {{ hasExactDuplicate(word) ? 'Identical word exists — edit or skip' : 'Word already exists' }}
                            </v-btn>
                        </div>

                        <!-- 只有真正点过 Add Anyway 后才显示 -->
                        <div v-else>
                            <v-btn v-if="word.confirmedDuplicateKey && findDuplicates(word).length > 0" class="ma-2" color="grey-darken-4" variant="tonal" size="small" :disabled="loading" @click="word.confirmedDuplicateKey = null;">
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

                    <v-alert v-if="!validImportWord(word)" type="warning" variant="tonal" class="mt-3" density="compact">
                        Enter both sides, keep the front within 255 characters, and choose a type.
                    </v-alert>

                    <v-btn height="25" class="mt-4" prepend-icon="mdi-arrow-up-thick" append-icon="mdi-arrow-down-thick" :disabled="loading" color="black" @click="swap(index)" block variant="outlined">Swap the front and back</v-btn>
                </v-card-text>
            </v-card>

            <v-btn v-if="hasDuplicateWords" block variant="tonal" color="orange-darken-3" prepend-icon="mdi-skip-next-circle-outline" class="mb-2" :disabled="loading" @click="skipAllDuplicateWords">
                Skip All Duplicate Words
            </v-btn>

            <v-btn block color="teal-lighten-1" @click="addToNotebook" :disabled="!canAddToNotebook">
                {{ loading ? 'Adding...'
                    : formattedSourceWords.some(word => word.ifLoad)
                        ? (canAddToNotebook ? 'Add to notebook' : 'There are conflicts')
                        : 'No words selected'
                }}
            </v-btn>
        </v-card-text>
    </v-card>

    <v-overlay v-model="duplicateConfirmOverlay" class="align-center d-flex justify-center" contained persistent>
        <v-card width="90vw" max-width="700">
            <v-card-title style="font-size: 20px; color: grey;">"{{ duplicateConfirmWord?.word }}" has already been added.</v-card-title>

            <div class="my-4 pa-2 overflow-x-auto d-flex flex-nowrap hide-scrollbar">
                <v-sheet v-for="(item, index) in currentDuplicateWords" :key="index" width="40%" height="25vh" class="flex-shrink-0 mr-4">
                    <p>Explanation {{ index + 1 }}</p>
                    <v-divider :thickness="1" color="info" class="my-2"></v-divider>
                    <p style="white-space: pre-line;">{{ item.explanation }}</p>
                </v-sheet>
            </div>

            <v-card-actions>
                <v-btn color="light-green-darken-4" :disabled="loading || hasExactDuplicate(duplicateConfirmWord)" @click="confirmDuplicateImport">
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
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { normalizeText, sameFront, sameWord, validImportWord } from '@/utilities/import-words';

const props = defineProps({
    sourceWords: { type: Array, required: true },
    existingWords: { type: Array, required: true },
    loading: Boolean,
});

const emit = defineEmits(['cancel', 'submit']);

const formattedSourceWords = ref([]);
const duplicateConfirmOverlay = ref(false);
const duplicateConfirmWord = ref(null);

watch(() => props.sourceWords, source => {
    formattedSourceWords.value = source.map(word => ({
        ...word,
        ifLoad: true,
        confirmedDuplicateKey: null
    }));

    duplicateConfirmOverlay.value = false;
    duplicateConfirmWord.value = null;
}, { immediate: true });

/*
 * 这里只查目标 notebook 中已经存在的词。
 * sourceWords 之间不因为 front 相同就构成 duplicate。
 */
function findDuplicates(word) {
    if (!word) return [];

    return props.existingWords.filter(existingWord =>
        sameFront(existingWord, word)
    );
}

/*
 * 判断目标 notebook 中是否已经存在完全一样的卡片：
 * type + word + explanation 都一样。
 */
function hasExactDuplicate(word) {
    return !!word && findDuplicates(word).some(item =>
        sameWord(item, word)
    );
}

/*
 * source batch 内部只禁止完全相同的卡片。
 *
 * apple -> 苹果
 * apple -> 苹果公司
 *
 * 可以同时加入。
 *
 * apple -> 苹果
 * apple -> 苹果
 *
 * 不可以同时加入。
 */
function hasSourceExactDuplicate(word) {
    if (!word || !word.ifLoad) return false;

    return formattedSourceWords.value.some(sourceWord =>
        sourceWord !== word &&
        sourceWord.ifLoad &&
        sameWord(sourceWord, word)
    );
}

/*
 * 用户确认 Add Anyway 时记录当前冲突状态。
 * 如果之后修改 word / explanation / type，
 * key 会变化，从而要求重新确认。
 */
function duplicateKey(word) {
    return JSON.stringify([
        normalizeText(word.word),
        normalizeText(word.explanation),
        word.type,
        findDuplicates(word)
            .map(item => [
                normalizeText(item.word),
                normalizeText(item.explanation),
                item.type
            ])
            .sort()
    ]);
}

/*
 * 只有目标 notebook 中已经存在相同 front + type 时，
 * 才需要用户确认。
 *
 * 如果完全相同，则永远保持冲突，
 * 不能通过 Add Anyway 绕过。
 */
function needsDuplicateConfirmation(word) {
    if (!word || !word.ifLoad)
        return false;

    if (hasExactDuplicate(word))
        return true;

    const duplicates = findDuplicates(word);

    if (!duplicates.length)
        return false;

    return word.confirmedDuplicateKey !== duplicateKey(word);
}

const currentDuplicateWords = computed(() =>
    findDuplicates(duplicateConfirmWord.value)
);

const hasDuplicateWords = computed(() =>
    formattedSourceWords.value.some(needsDuplicateConfirmation)
);

const canAddToNotebook = computed(() =>
    !props.loading &&
    formattedSourceWords.value.some(word => word.ifLoad) &&
    formattedSourceWords.value
        .filter(word => word.ifLoad)
        .every(word =>
            validImportWord(word) &&
            !hasSourceExactDuplicate(word) &&
            !needsDuplicateConfirmation(word)
        )
);

function skipAllDuplicateWords() {
    const duplicates = formattedSourceWords.value.filter(needsDuplicateConfirmation);

    duplicates.forEach(word => {
        word.ifLoad = false;
        word.confirmedDuplicateKey = null;
    });
}

function confirmDuplicateImport() {
    if (!duplicateConfirmWord.value)
        return;

    /*
     * 如果目标 notebook 中已经有完全相同的卡片，
     * 不允许 Add Anyway。
     */
    if (hasExactDuplicate(duplicateConfirmWord.value))
        return;

    duplicateConfirmWord.value.confirmedDuplicateKey =
        duplicateKey(duplicateConfirmWord.value);

    duplicateConfirmOverlay.value = false;
    duplicateConfirmWord.value = null;
}

function swap(index) {
    const word = formattedSourceWords.value[index];

    [word.word, word.explanation] = [
        word.explanation,
        word.word
    ];
}

function addToNotebook() {
    if (!canAddToNotebook.value)
        return;

    emit(
        'submit',
        formattedSourceWords.value
            .filter(word => word.ifLoad)
            .map(word => ({
                word: word.word.replace(/\r\n/g, '\n').trim(),
                explanation: word.explanation.replace(/\r\n/g, '\n').trim(),
                type: word.type,
            }))
    );
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