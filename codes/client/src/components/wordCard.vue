<template>
    <div style="margin-top: 10vh;">
        <v-card height="65vh" width="82%" class="mx-auto px-4 pt-4 rounded-xl elevation-12" color="black">
            <v-card-text>
                <div class="card-content">
                    <div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: center;">
                        <ol v-if="shouldUseOrderedList">
                            <li v-for="(item, index) in rectos" :key="index">
                                <p class="text-center preserve-breaks" style="height: auto; font-size: 1.2rem; line-height: 1.6rem;">
                                    {{ item.word || item }}
                                </p>
                            </li>
                        </ol>
                        <div v-else>
                            <p class="text-center preserve-breaks" style="height: auto; font-size: 1.2rem; line-height: 1.6rem;">
                                {{ rectos[0]?.word || rectos[0] || '' }}
                            </p>
                        </div>
                    </div>
                    <div style="width: 90%">
                        <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                        <v-card-actions>
                            <v-btn color="#A4A4A4" block variant="text" @click="verso = true" :disabled="alertStore.loading">Cliquez pour voir le verso</v-btn>
                        </v-card-actions>
                    </div>
                </div>
            </v-card-text>

            <v-expand-transition>
                <v-card v-if="verso" class="position-absolute w-100 rounded-xl" height="100%" width="26vw" style="bottom: 0; left: 0;">
                    <v-card-text>
                        <div class="card-content">
                            <div class="align-self-start" style="width: 100%;">
                                <div class="d-flex flex-space-between" style="width: 100%;">
                                    <p class="text-h5" style="flex: 1 1 auto;">Explication</p>
                                    <v-card-actions class="pa-0">
                                        <v-btn color="teal-accent-4 mr-2" icon="mdi-backspace" @click="verso = false" :disabled="alertStore.loading"></v-btn>
                                    </v-card-actions>
                                </div>  
                            </div>

                            <div v-if="!props.reversedWord" class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 90%;">
                                <div v-for="(item, index) in versos" :key="index" style="width: 95%;">
                                    <div class="d-flex mx-2" style="width: 100%; height: 100%;">
                                        <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                            <div style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                                <p class="text-medium-emphasis mb-4 pl-1 preserve-breaks" style="font-size: 1.1rem; line-height: 1.2rem;">
                                                    {{ item.explanation }}
                                                </p>
                                            </div>
                                            <div>
                                                <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                                <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center">
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="learnRetenu(item)" color="green accent-4 mr-3" variant="text">Retenu</v-btn>
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="ARevoir(item)" color="red accent-4 ml-3" variant="text">À revoir</v-btn>
                                                </v-card-actions>
                                                <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center">
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewMatriser(item)" color="blue accent-4" variant="text">Maîtrisé</v-btn>
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewFlou(item)" color="#BEC832" variant="text">Flou</v-btn>
                                                    <v-btn :disabled="!item.__needBtn__ || alertStore.loading" @click="reviewOublie(item)" color="red accent-4 ml-3" variant="text">Oublié</v-btn>
                                                </v-card-actions>
                                            </div>
                                        </div>
                                        <v-divider color="red" opacity=".7" thickness="3" gradient vertical></v-divider>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 90%;">
                                <!-- 是倒转词，应该是多个意思对应一个词汇，按钮总是显示，因为这个词汇是列表里的，就算某些意义不在列表里 -->
                                    <div class="d-flex mx-2" style="width: 100%; height: 100%;">
                                    <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                        <div style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                            <p class="text-medium-emphasis mb-4 pl-1 preserve-breaks" style="font-size: 1.1rem; line-height: 1.2rem;">
                                                {{ props.word[0].explanation }}
                                            </p>
                                        </div>
                                        <div>
                                            <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                            <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center">
                                                <v-btn :disabled="alertStore.loading" @click="learnRetenu(props.word[0])" color="green accent-4 mr-3" variant="text">Retenu</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="ARevoir(props.word[0])" color="red accent-4 ml-3" variant="text">À revoir</v-btn>
                                            </v-card-actions>
                                            <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center">
                                                <v-btn :disabled="alertStore.loading" @click="reviewMatriser(props.word[0])" color="blue accent-4" variant="text">Maîtrisé</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="reviewFlou(props.word[0])" color="#BEC832" variant="text">Flou</v-btn>
                                                <v-btn :disabled="alertStore.loading" @click="reviewOublie(props.word[0])" color="red accent-4 ml-3" variant="text">Oublié</v-btn>
                                            </v-card-actions>
                                        </div>
                                    </div>
                                    <v-divider color="red" opacity=".7" thickness="3" gradient vertical></v-divider>
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
    // 检查word列表里每个项的word属性是否相同，如果相同则只保留第一个，否则保留所有
    if (props.reversedWord) {
        return props.word[0].word.split(' %/% ');
    }

    const seenWords = new Set();
    return props.word.filter(item => {
        if (seenWords.has(item.word)) {
            return false;
        } else {
            seenWords.add(item.word);
            return true;
        }
    });
})

const isLoadingPlaceholder = computed(() => {
    return props.word.length === 1 && props.word[0].word === 'Chargement...';
});

const shouldUseOrderedList = computed(() => {
    return !isLoadingPlaceholder.value && rectos.value.length > 1;
});

const versos = computed(() => {
    const seenExplanations = new Set();
    console.log("计算versos，当前的word列表：", props.word);
    return props.word.filter(item => {
        if (seenExplanations.has(item.explanation)) {
            return false;
        } else {
            seenExplanations.add(item.explanation);
            return true;
        }
    });
})

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
    // console.log(item.word, "被点击")
    // 针对 位于词汇队列中的词汇和位于记忆队列中的词汇有不同的操作
    const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
    if (index !== -1) {
        // console.log("词汇位于词汇队列，位置索引：", index, "于是将word队列的这个词汇提出到记忆窗口");
        // 词汇位于词汇队列
        // 踢出词汇队列
        wordStore.dropFromReviewQueue(item);
        // 但凡是双选界面，就是在学习/复习，都要加入 memoryWindow
        await wordStore.enqueueToWindow(item, props.learnStatus === 'new', versos.value.length > 1); // 根据学习新词还是复习词汇中的learn有不同的处理，如果是学习新词，需要更新词汇的数据库状态，如果是复习词汇，则只需踢出队列
        // console.log("这个词汇位于词汇队列，点击了记住了，提出到记忆窗口，当前记忆窗口：", wordStore.memoryWindow);
    } else {
        // 位于记忆队列，点击确定后加入临时状态
        if (versos.value.length > 1) {
            wordStore.memoryWindowProgressTempWordList[item.word] = wordStore.memoryWindowProgressTempWordList[item.word] || [];
            wordStore.memoryWindowProgressTempWordList[item.word].push(item);
            // console.log("这个词汇位于记忆队列，点击了记住了，加入临时状态，当前这个词汇的临时状态列表：", wordStore.memoryWindowProgressTempWordList[item.word]);
        }
    }
    // console.log("加载下一张卡片，如果不位于词汇队列，但是刚才又复习到了，说明在记忆队列，直接加载下一个，不用处理队列");
    item.__needBtn__ = false;
    } finally {
        alertStore.setLoading(false);
    }
}

function ARevoir(item) {
    // 也要根据位于词汇队列还是记忆队列区分
    const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
    if (index !== -1) wordStore.aRevoirRQ(item);
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
        } else {
            await wordStore.updateWordStatus(forwardWord);
        }

        delete wordStore.reviewActiveWordStatusList[forwardKey];
    }
}

async function reviewMatriser(item) {
    /*
        这里的问题是，如果这个单词是active的，那么掌握的标准应该是双向都记住
        我们不能通过单纯的id进行判断是否记住了背面，因为比如出现3个单词的word都是相同的但是又3个不同的个解释，那么就会出现混淆
        解决的办法是：不论什么时候复习到倒转意义，如果记住了，就标记为1，表示记住了反过来的解释，这个第一次时候直接把之前所有记住过的正向词汇更新状态
        并且在之后的所有正向词汇被记住时都直接更新状态
    */
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
            console.log("点击了掌握了，提出这个词汇，当前的队列有这么多个：", wordStore.reviewQueue.length);
            wordStore.reviewWordLimitPosition --;
            wordStore.reviewWordCount += 1;
            item.__needBtn__ = false;
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function reviewFlou(item) {
    // 正向词和反向词但凡有一个选择了flou，那么就算flou，就算另一个是掌握，也算是flou；但是如果另一个是忘记，那么就算忘记，按照最差的情况来
    // 而且又要兼顾一个正向词对应多个意思，这样的时候反向词是只有一个，但正向词会有多个意义对应每一个都会被选择，使用一个reviewWordStatusList记录状态
    // 当正向/反向都被标记的时候再做判断，决定如何更新数据库状态
    if (wordStore !== null) {
        alertStore.setLoading(true);
        try {
            if (item.type === 'active') {
                markActiveReviewStatus(item, 2);
                await applyActiveWorstStatusIfReady(item);
            } else {
                await wordStore.updateWordStatus(item);
            }

            wordStore.aRevoirRQ(item); // 这个时候虽然更新词汇状态，但还是要把它重新加入队列末尾，还要复习
            wordStore.reviewWordCount += 1;
            item.__needBtn__ = false;
            console.log("模糊，现在的队列", JSON.stringify(wordStore.reviewQueue));
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

            wordStore.aRevoirRQ(item);
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
.solid-divider {
    --v-border-opacity: 1;
}

.card-content {
    width: 100%;
    height: 58vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
}

.hide-scroll-bar::-webkit-scrollbar {
    display: none;
}

.preserve-breaks {
    white-space: pre-line;
}
</style>