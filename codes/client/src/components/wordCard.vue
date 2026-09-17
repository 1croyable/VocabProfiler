<template>
    <div class="flip-container" style="perspective: 1200px;">
        <transition name="card-flip" mode="out-in">
            <v-card v-if="!verso" key="front" width="82%" class="word-card mx-auto px-4 pt-4 rounded-xl elevation-12" color="black">
                <v-card-text>
                    <div class="card-content">
                        <div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: center;">
                            <ol v-if="shouldUseOrderedList">
                                <li v-for="(item, index) in rectos" :key="index">
                                    <p class="text-center" style="white-space: pre-line; height: auto; font-size: 1.2rem; line-height: 1.6rem;">
                                        {{ item.word || item }}
                                    </p>
                                </li>
                            </ol>
                            <div v-else>
                                <p class="text-center" style="white-space: pre-line; height: auto; font-size: 1.2rem; line-height: 1.6rem;">
                                    {{ rectos[0]?.word || rectos[0] || '' }}
                                </p>
                            </div>
                        </div>
                        <div style="width: 90%">
                            <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                            <v-card-actions>
                                <v-btn color="#A4A4A4" block variant="text" @click="verso = true" :disabled="alertStore.loading">Click to see the back</v-btn>
                            </v-card-actions>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-card v-else key="back" class="verso-card-3d rounded-xl mx-auto px-4 pt-4 word-card" width="82%">
                <v-card-text>
                    <div class="card-content">
                        <div class="align-self-start" style="width: 100%;">
                            <div class="d-flex justify-space-between" style="width: 100%;">
                                <p class="text-h5">Explanation</p>
                            </div>  
                            <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                        </div>

                        <div v-if="!props.reversedWord" ref="versoScroller" @scroll="handleVersoScroll" class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="flex: 1 1 auto; min-height: 0; width: 100%;">
                            <div v-for="(item, index) in versos" :key="`${item.id}-${item.__isReversed__ ? 'reverse' : 'forward'}`" class="verso-item flex-shrink-0 position-relative" :style="{ width: versos.length === 1 ? '100%' : '95%', height: '100%' }">
                                <v-chip v-if="versos.length > 1 && item.__needBtn__" size="small" color="orange-darken-2" variant="tonal" class="position-absolute" style="top: 8px; left: 8px; z-index: 1;">
                                    {{ props.cardType === 'learn' ? 'To learn' : 'To review' }}
                                </v-chip>
                                
                                <div class="d-flex" style="width: 100%; height: 100%;">
                                    <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                        <div class="d-flex align-center justify-center" style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                            <p class="text-medium-emphasis text-center px-4 mb-0" style="width: 100%; white-space: pre-line; font-size: 1.1rem; line-height: 1.6rem;">
                                                {{ item.explanation }}
                                            </p>
                                        </div>
                                        <div class="desktop-score-block">
                                            <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                            <v-card-actions v-if="props.cardType === 'learn'" class="desktop-score-actions d-flex justify-center px-0">
                                                <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="Learned(item)" color="green accent-4" variant="text">Learned</v-btn>
                                                <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="MoveToReviewQueue(item)" color="red accent-4" variant="text">To Review</v-btn>
                                            </v-card-actions>
                                            <v-card-actions v-else-if="props.cardType === 'review'" class="desktop-score-actions d-flex justify-center px-0">
                                                <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewMatriser(item)" color="blue accent-4" variant="text">Mastered</v-btn>
                                                <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewFlou(item)" color="#BEC832" variant="text">Unclear</v-btn>
                                                <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewOublie(item)" color="red accent-4" variant="text">Forgotten</v-btn>
                                            </v-card-actions>
                                        </div>
                                    </div>
                                    <v-divider v-show="index !== versos.length - 1" class="border-opacity-100" color="#DEDEDE" vertical></v-divider>
                                </div>
                            </div>
                        </div>

                        <div v-else class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="flex: 1 1 auto; min-height: 0; width: 100%;">
                            <!-- 是倒转词，应该是多个意思对应一个词汇，按钮总是显示，因为这个词汇是列表里的，就算某些意义不在列表里 -->
                            <div class="d-flex" style="width: 100%; height: 100%;">
                                <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                    <div class="d-flex align-center justify-center" style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                        <p class="text-medium-emphasis text-center px-4 mb-0" style="width: 100%; white-space: pre-line; font-size: 1.1rem; line-height: 1.6rem;">
                                            {{ props.word[0].explanation }}
                                        </p>
                                    </div>
                                    <div class="desktop-score-block">
                                        <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                        <v-card-actions v-if="props.cardType === 'learn'" class="desktop-score-actions d-flex justify-center px-0">
                                            <v-btn :disabled="alertStore.loading" @click="Learned(props.word[0])" color="green accent-4" variant="text">Learned</v-btn>
                                            <v-btn :disabled="alertStore.loading" @click="MoveToReviewQueue(props.word[0])" color="red accent-4" variant="text">To Review</v-btn>
                                        </v-card-actions>
                                        <v-card-actions v-else-if="props.cardType === 'review'" class="desktop-score-actions d-flex justify-center px-0">
                                            <v-btn :disabled="alertStore.loading" @click="reviewMatriser(props.word[0])" color="blue accent-4" variant="text">Mastered</v-btn>
                                            <v-btn :disabled="alertStore.loading" @click="reviewFlou(props.word[0])" color="#BEC832" variant="text">Unclear</v-btn>
                                            <v-btn :disabled="alertStore.loading" @click="reviewOublie(props.word[0])" color="red accent-4" variant="text">Forgotten</v-btn>
                                        </v-card-actions>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="width: 90%">
                            <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%" />

                            <v-card-actions>
                                <v-btn color="#A4A4A4" block variant="text" @click="verso = false" :disabled="alertStore.loading">
                                    Click to see the front
                                </v-btn>
                            </v-card-actions>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </transition>

        <div v-if="currentVerso" class="mobile-score-panel" :class="{ disabled: !canRememberCurrent }">
            <div class="mobile-score-buttons">
                <v-btn v-if="props.cardType === 'learn'" width="150px" height="35px" class="rounded-xl" color="red" variant="outlined" :disabled="!canRememberCurrent" @click="MoveToReviewQueue(currentVerso)">
                    To Review
                </v-btn>

                <template v-else-if="props.cardType === 'review'">
                    <v-btn width="105px" height="35px" class="rounded-xl" color="#BEC832" variant="outlined" :disabled="!canRememberCurrent" @click="reviewFlou(currentVerso)">
                        Unclear
                    </v-btn>

                    <v-btn width="130px" height="35px" class="rounded-xl" color="red" variant="outlined" :disabled="!canRememberCurrent" @click="reviewOublie(currentVerso)">
                        Forgotten
                    </v-btn>
                </template>
            </div>

            <div class="desktop-bottom-score-buttons">
                <template v-if="props.cardType === 'learn'">
                    <v-btn color="green accent-4" variant="text" :disabled="!canRememberCurrent" @click="Learned(currentVerso)">Learned</v-btn>
                    <v-btn color="red accent-4" variant="text" :disabled="!canRememberCurrent" @click="MoveToReviewQueue(currentVerso)">To Review</v-btn>
                </template>

                <template v-else-if="props.cardType === 'review'">
                    <v-btn color="blue accent-4" variant="text" :disabled="!canRememberCurrent" @click="reviewMatriser(currentVerso)">Mastered</v-btn>
                    <v-btn color="#BEC832" variant="text" :disabled="!canRememberCurrent" @click="reviewFlou(currentVerso)">Unclear</v-btn>
                    <v-btn color="red accent-4" variant="text" :disabled="!canRememberCurrent" @click="reviewOublie(currentVerso)">Forgotten</v-btn>
                </template>
            </div>

            <div ref="rememberTrack" class="remember-area" @pointerdown="startRememberDrag" @pointermove="moveRememberDrag" @pointerup="endRememberDrag" @pointercancel="cancelRememberDrag">
                <svg class="remember-arc" viewBox="0 0 120 120" preserveAspectRatio="none">
                    <path d="M 18 100 A 92 92 0 0 1 102 18" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
                </svg>

                <div class="remember-handle" :style="rememberHandleStyle">
                    <v-icon icon="mdi-check" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useWordStore, useAlertStore } from '@/stores';

const verso = ref(false);
const wordStore = useWordStore();
const alertStore = useAlertStore();

const currentVersoIndex = ref(0);
const versoScroller = ref(null);
const rememberTrack = ref(null);
const rememberProgress = ref(0);
const rememberDragging = ref(false);

let versoScrollTimer = null;

// 声明向父组件发出的事件
const emit = defineEmits(['nextCard']);

const props = defineProps({
    cardType: {
        type: String,
        required: false,
        default: "learn"
    },
    word: {
        type: Array,
        required: true,
    },
    learnStatus: {
        type: String,
        required: true,
    },
    reversedWord: {
        type: Boolean,
        required: false,
    }
});

const rectos = computed(() => {
    /**
     * 传入的有可能是类似这样的格式：
        props.word = [
            { word: "chat", explanation: "猫" },
            { word: "chat", explanation: "闲聊" },
            { word: "chat", explanation: "聊天" }
        ]
     */

    // 反向卡片：多个解释 -> 一个基础词汇
    if (props.reversedWord) {
        const baseWord = props.word[0]?.explanation;

        const seenExplanations = new Set();

        return wordStore.words
            .filter(item =>
                item.type === 'active' &&
                item.word === baseWord
            )
            .filter(item => {
                if (seenExplanations.has(item.explanation)) {
                    return false;
                }

                seenExplanations.add(item.explanation);
                return true;
            })
            .map(item => ({
                word: item.explanation,
            }));
    }

    // 正向卡片：同一个基础词汇只在正面显示一次
    return props.word.length > 0 ? [{ word: props.word[0].word }] : [];
})

const isLoadingPlaceholder = computed(() => {
    return props.word.length === 1 && props.word[0].word === 'Chargement...';
});

const shouldUseOrderedList = computed(() => {
    return !isLoadingPlaceholder.value && rectos.value.length > 1;
});

// 当前背诵轮次构建出的versos
const sessionVersos = computed(() => {
    const seenExplanations = new Set();

    return props.word.filter(item => {
        if (seenExplanations.has(item.explanation)) {
            return false;
        }

        seenExplanations.add(item.explanation);
        return true;
    });
});
// 当前页面实际显示的反面。对积极词汇的正向，额外动态读取 wordStore.words，显示背诵过程中新增的解释。
const versos = computed(() => {
    const currentVersos = sessionVersos.value;

    if (props.reversedWord || isLoadingPlaceholder.value)
        return currentVersos;

    const baseWord = props.word[0];

    const seenExplanations = new Set(
        currentVersos.map(item => item.explanation)
    );

    const newlyAddedVersos = wordStore.words
        .filter(item =>
            item.type === baseWord.type &&
            item.word === baseWord.word &&
            item.notebook_id === baseWord.notebook_id
        )
        .filter(item => {
            if (seenExplanations.has(item.explanation)) {
                return false;
            }

            seenExplanations.add(item.explanation);
            return true;
        })
        .map(item => ({
            ...item,
            __needBtn__: false
        }));

    return [...newlyAddedVersos, ...currentVersos];
});

const currentVerso = computed(() => {
    if (props.reversedWord)
        return props.word[0] ?? null;

    return versos.value[currentVersoIndex.value] ?? null;
});

const canRememberCurrent = computed(() => {
    return verso.value && !!currentVerso.value?.__needBtn__ && !alertStore.loading;
});

const rememberHandleStyle = computed(() => {
    const t = rememberProgress.value;
    const u = 1 - t;

    const x =
        u * u * 12 +
        2 * u * t * 40 +
        t * t * 88;

    const y =
        u * u * 82 +
        2 * u * t * 15 +
        t * t * 18;

    return {
        left: `${x}%`,
        top: `${y}%`,
    };
});

function handleVersoScroll(event) {
    const container = event.currentTarget;

    clearTimeout(versoScrollTimer);

    versoScrollTimer = setTimeout(() => {
        const items = [...container.querySelectorAll('.verso-item')];

        if (items.length === 0)
            return;

        const containerRect = container.getBoundingClientRect();
        const center = containerRect.left + containerRect.width / 2;

        let bestIndex = 0;
        let bestDistance = Infinity;

        items.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(itemCenter - center);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        currentVersoIndex.value = bestIndex;
        rememberProgress.value = 0;
        rememberDragging.value = false;
    }, 80);
}

function updateRememberProgress(event) {
    const rect = rememberTrack.value?.getBoundingClientRect();

    if (!rect)
        return;

    const start = rect.left + rect.width * 0.08;
    const length = rect.width * 0.84;

    rememberProgress.value = Math.max(
        0,
        Math.min(1, (event.clientX - start) / length)
    );
}

function startRememberDrag(event) {
    if (!canRememberCurrent.value)
        return;

    const rect = rememberTrack.value?.getBoundingClientRect();

    if (!rect)
        return;

    if (event.clientX > rect.left + rect.width * 0.3)
        return;

    rememberDragging.value = true;
    rememberProgress.value = 0;

    event.currentTarget.setPointerCapture(event.pointerId);
}

function moveRememberDrag(event) {
    if (!rememberDragging.value)
        return;

    updateRememberProgress(event);
}

async function endRememberDrag() {
    if (!rememberDragging.value)
        return;

    rememberDragging.value = false;

    if (rememberProgress.value >= 0.85 && currentVerso.value) {
        if (props.cardType === 'learn')
            await Learned(currentVerso.value);
        else
            await reviewMatriser(currentVerso.value);
    }

    rememberProgress.value = 0;
}

function cancelRememberDrag() {
    rememberDragging.value = false;
    rememberProgress.value = 0;
}

watch(
    () => `${props.word[0]?.id ?? ''}:${!!props.word[0]?.__isReversed__}`,
    () => {
        currentVersoIndex.value = 0;
        rememberProgress.value = 0;
        rememberDragging.value = false;
    }
);

watch(
    () => props.word,
    (newVal, oldVal) => {
        if (isLoadingPlaceholder.value) {
            verso.value = false;
            return;
        }

        let needNext = true;
        props.word.forEach((item, index) => {
            if (item.__needBtn__) {
                needNext = false;
            }
        });
        if (needNext) {
            props.word.forEach((item, index, array) => {
                array[index].__needBtn__ = true;
            });
            emit('nextCard');
            verso.value = false;
        }
    },
    { deep: true }
);

async function Learned(item) {
    if (alertStore.loading || !item.__needBtn__)
        return;

    try {
        alertStore.setLoading(true);

        const isInReviewQueue = wordStore.reviewQueue.some(w => w.id === item.id && !!w.__isReversed__ === !!item.__isReversed__);

        if (isInReviewQueue) {
            wordStore.dropFromReviewQueue(item);
            await wordStore.enqueueToWindow(item, props.learnStatus === 'new', versos.value.length > 1);
        }
        else if (versos.value.length > 1) {
            const progressList = wordStore.memoryWindowProgressTempWordList[item.word] ?? [];

            const alreadyRecorded = progressList.some(w => w.id === item.id && !!w.__isReversed__ === !!item.__isReversed__);

            if (!alreadyRecorded)
                progressList.push(item);

            wordStore.memoryWindowProgressTempWordList[item.word] = progressList;
        }
        
        item.__needBtn__ = false;
    } 
    catch (error) {
        console.error('Failed to mark word as learned:', error);
    }
    finally {
        alertStore.setLoading(false);
    }
}

function MoveToReviewQueue(item) {
    // 要根据位于词汇队列还是记忆队列区分
    if (alertStore.loading || !item.__needBtn__)
        return;

    const isInReviewQueue = wordStore.reviewQueue.some(w =>
        w.id === item.id &&
        !!w.__isReversed__ === !!item.__isReversed__
    );

    if (isInReviewQueue)
        wordStore.putToReviewQueue(item);
    else
        wordStore.moveBackToReviewQueue(item);

    item.__needBtn__ = false;
}

function getActiveBaseWord(item) {
    return item.__isReversed__ ? item.explanation : item.word;
}

function getForwardKey(word, explanation) {
    return `${word} %/% ${explanation}`;
}

function markActiveReviewStatus(item, status) {
    const baseWord = getActiveBaseWord(item);
    if (item.__isReversed__) {
        const existing = wordStore.reviewActiveWordReversedStatusList[baseWord] || 0;
        wordStore.reviewActiveWordReversedStatusList[baseWord] = Math.max(existing, status);
    } else {
        wordStore.reviewActiveWordStatusList[getForwardKey(item.word, item.explanation)] = status;
    }
}

async function applyActiveWorstStatusIfReady(item) {
    const baseWord = getActiveBaseWord(item);
    const reversedStatus = wordStore.reviewActiveWordReversedStatusList[baseWord];
    if (!reversedStatus) return;

    const forwardWords = wordStore.words.filter(w => w.type === 'active' && w.word === baseWord);

    for (const forwardWord of forwardWords) {
        const forwardKey = getForwardKey(forwardWord.word, forwardWord.explanation);
        const forwardStatus = wordStore.reviewActiveWordStatusList[forwardKey];
        if (!forwardStatus) continue;

        const finalStatus = Math.max(reversedStatus, forwardStatus);
        if (finalStatus === 3) {
            await wordStore.updateWordStatus(forwardWord, 1);
        }
        else if (finalStatus === 2) {
            await wordStore.updateWordStatus(forwardWord, Math.max(1, forwardWord.level - 1));
        }
        else {
            await wordStore.updateWordStatus(forwardWord);
        }

        delete wordStore.reviewActiveWordStatusList[forwardKey];
    }
}

async function reviewMatriser(item) {
    if (wordStore !== null) {
        alertStore.setLoading(true);
        try {
            if (item.type === 'active') {
                markActiveReviewStatus(item, 1);
                await applyActiveWorstStatusIfReady(item);
            } else {
                await wordStore.updateWordStatus(item);
            }

            wordStore.dropFromReviewQueue(item);
            wordStore.reviewWordLimitPosition --;
            wordStore.reviewWordCount += 1;
            item.__needBtn__ = false;
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function reviewFlou(item) {
    if (wordStore !== null) {
        alertStore.setLoading(true);
        try {
            if (item.type === 'active') {
                markActiveReviewStatus(item, 2);
                await applyActiveWorstStatusIfReady(item);
            } else {
                await wordStore.updateWordStatus(item, Math.max(1, item.level - 1));
            }

            wordStore.putToReviewQueue(item);

            wordStore.reviewWordLimitPosition = Math.max(0, wordStore.reviewWordLimitPosition - 1);
            wordStore.reviewWordCount += 1;

            item.__needBtn__ = false;
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function reviewOublie(item) {
    if (wordStore !== null) {
        alertStore.setLoading(true);
        try {
            if (item.type === 'active') {
                markActiveReviewStatus(item, 3);
                await applyActiveWorstStatusIfReady(item);
            } else {
                await wordStore.updateWordStatus(item, 1);
            }

            wordStore.putToReviewQueue(item);

            wordStore.reviewWordLimitPosition = Math.max(0, wordStore.reviewWordLimitPosition - 1);
            wordStore.reviewWordCount += 1;
            item.__needBtn__ = false;
        } finally {
            alertStore.setLoading(false);
        }
    }
}
</script>

<style lang="less" scoped>
.card-content {
    width: 100%;
    height: 58vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
}

@media (max-width: 960px) {
    .card-content {
        height: 53vh;
    }
}

@media (hover: none) and (pointer: coarse) {
    .hide-scroll-bar::-webkit-scrollbar {
        display: none;
    }

    .hide-scroll-bar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
}

.flip-card {
    transform-style: preserve-3d;
    backface-visibility: hidden;
    transform-origin: center center;
}

.card-flip-enter-active,
.card-flip-leave-active {
    transition:
        transform 140ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 140ms ease;
}

.card-flip-enter-from {
    transform: rotate3d(0.268, 1, 0, 90deg) scale(0.98);
    opacity: 0;
}

.card-flip-enter-to {
    transform: rotate3d(0.268, 1, 0, 0deg) scale(1);
    opacity: 1;
}

.card-flip-leave-from {
    transform: rotate3d(0.268, 1, 0, 0deg) scale(1);
    opacity: 1;
}

.card-flip-leave-to {
    transform: rotate3d(0.268, 1, 0, -90deg) scale(0.98);
    opacity: 0;
}

.mobile-score-panel {
    width: 82%;
    margin: 14px auto 0;
}

.word-card {
    height: 65vh;
}

@media (max-width: 960px) {
    .word-card {
        height: 60vh !important;
    }
}

.desktop-bottom-score-buttons {
    display: none;
}

@media (min-width: 961px) {
    .mobile-score-panel {
        display: flex;
        justify-content: center;
    }

    .mobile-score-buttons {
        display: none;
    }

    .remember-area {
        display: none;
    }

    .desktop-bottom-score-buttons {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 16px;
        width: 100%;
    }
}

.desktop-score-block {
    display: none;
}

@media (max-width: 960px) {
    .mobile-score-panel {
        width: 82%;
        margin: 14px auto 0;
        display: flex;
        align-items: stretch;
        gap: 14px;
    }

    .mobile-score-buttons {
        width: 40%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }

    .remember-area {
        position: relative;
        width: 58%;
        height: 110px;
        touch-action: none;
        user-select: none;
        cursor: grab;
    }

    .remember-arc {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        color: rgba(var(--v-theme-success), 0.28);
        pointer-events: none;
    }

    .remember-handle {
        position: absolute;
        width: 42px;
        height: 42px;
        border-radius: 50%;

        background: rgb(var(--v-theme-success));
        color: white;

        display: flex;
        align-items: center;
        justify-content: center;

        transform: translate(-50%, -50%);
        transition:
            left 80ms linear,
            top 80ms linear;

        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }

    .remember-area:active .remember-handle {
        transition: none;
    }

    .remember-label {
        position: absolute;
        left: 0;
        bottom: 2px;
        width: 100%;
        text-align: center;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .mobile-score-panel.disabled {
        opacity: 0.35;
        pointer-events: none;
    }
}

.flip-container {
    margin-top: 10vh;
}

@media (max-width: 960px) {
    .flip-container {
        margin-top: 5vh;
    }
}
</style>