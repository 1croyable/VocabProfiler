<template>
    <div style="margin-top: 10vh;">
        <v-card height="65vh" width="82%" class="mx-auto px-4 pt-4 rounded-xl elevation-12" color="black">
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

            <v-expand-transition>
                <v-card v-if="verso" class="position-absolute w-100 rounded-xl" height="100%" width="26vw" style="bottom: 0; left: 0;">
                    <v-card-text>
                        <div class="card-content">
                            <div class="align-self-start" style="width: 100%;">
                                <div class="d-flex justify-space-between" style="width: 100%;">
                                    <p class="text-h5">Explanation</p>
                                    <v-spacer />
                                    <v-card-actions class="pa-0">
                                        <v-btn width="40" height="40" min-width="40" color="teal-accent-4 mr-2" icon="mdi-arrow-down" @click="verso = false" :disabled="alertStore.loading"></v-btn>
                                    </v-card-actions>
                                </div>  
                                <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                            </div>

                            <div v-if="!props.reversedWord" class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 100%;">
                                <div v-for="(item, index) in versos" :key="index" class="flex-shrink-0" :style="{ width: versos.length === 1 ? '100%' : '95%', height: '100%' }">
                                    <div class="d-flex" style="width: 100%; height: 100%;">
                                        <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                            <div class="d-flex align-center justify-center" style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                                <p class="text-medium-emphasis text-center px-4 mb-0" style="width: 100%; white-space: pre-line; font-size: 1.1rem; line-height: 1.6rem;">
                                                    {{ item.explanation }}
                                                </p>
                                            </div>
                                            <div>
                                                <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                                <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center px-0">
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="learnRetenu(item)" color="green accent-4" variant="text">Learned</v-btn>
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="ARevoir(item)" color="red accent-4" variant="text">To Review</v-btn>
                                                </v-card-actions>
                                                <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center px-0">
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
                            <div v-else class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 100%;">
                                <!-- 是倒转词，应该是多个意思对应一个词汇，按钮总是显示，因为这个词汇是列表里的，就算某些意义不在列表里 -->
                                <div class="d-flex" style="width: 100%; height: 100%;">
                                    <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                        <div class="d-flex align-center justify-center" style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                            <p class="text-medium-emphasis text-center px-4 mb-0" style="width: 100%; white-space: pre-line; font-size: 1.1rem; line-height: 1.6rem;">
                                                {{ props.word[0].explanation }}
                                            </p>
                                        </div>
                                        <div>
                                            <v-divider class="border-opacity-100" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                            <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center px-0">
                                                <v-btn :disabled="alertStore.loading" @click="learnRetenu(props.word[0])" color="green accent-4" variant="text">Learned</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="ARevoir(props.word[0])" color="red accent-4" variant="text">To Review</v-btn>
                                            </v-card-actions>
                                            <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center px-0">
                                                <v-btn :disabled="alertStore.loading" @click="reviewMatriser(props.word[0])" color="blue accent-4" variant="text">Mastered</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="reviewFlou(props.word[0])" color="#BEC832" variant="text">Unclear</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="reviewOublie(props.word[0])" color="red accent-4" variant="text">Forgotten</v-btn>
                                            </v-card-actions>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-expand-transition>
        </v-card>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useWordStore, useAlertStore } from '@/stores';

const verso = ref(false);
const wordStore = useWordStore();
const alertStore = useAlertStore();

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
    const seenWords = new Set();

    return props.word.filter(item => {
        if (seenWords.has(item.word)) {
            return false;
        }

        seenWords.add(item.word);
        return true;
    });
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
            // console.log("触发nextCard事件");
            props.word.forEach((item, index, array) => {
                array[index].__needBtn__ = true;
            });
            emit('nextCard');
            verso.value = false;
        }
    },
    { deep: true }
);

async function learnRetenu(item) {
    alertStore.setLoading(true);
    try {
        const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
        if (index !== -1) {
            wordStore.dropFromReviewQueue(item);
            await wordStore.enqueueToWindow(item, props.learnStatus === 'new', versos.value.length > 1);
        } else {
            if (versos.value.length > 1) {
                wordStore.memoryWindowProgressTempWordList[item.word] = wordStore.memoryWindowProgressTempWordList[item.word] || [];
                wordStore.memoryWindowProgressTempWordList[item.word].push(item);
            }
        }
        item.__needBtn__ = false;
    } finally {
        alertStore.setLoading(false);
    }
}

function ARevoir(item) {
    // 也要根据位于词汇队列还是记忆队列区分
    const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
    if (index !== -1) wordStore.putToReviewQueue(item);
    else wordStore.aRevoirMQ(item);

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
            wordStore.reviewWordCount += 1;
            item.__needBtn__ = false;
            console.log("忘记了，现在的队列", JSON.stringify(wordStore.reviewQueue));
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

@media (hover: none) and (pointer: coarse) {
    .hide-scroll-bar::-webkit-scrollbar {
        display: none;
    }

    .hide-scroll-bar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
}
</style>