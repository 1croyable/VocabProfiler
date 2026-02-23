<template>
    <v-container fluid class="pa-0">
        <v-row no-gutters>
            <v-col cols="12" md="8" class="pa-0">
                <div id="left-bg" class="position-relative">
                    <v-overlay v-model="rajouterOverlay" class="align-center d-flex justify-center" contained>
                        <v-card max-width="60vw">
                            <v-card-title style="font-size: 20px; color: grey;">"{{ rectoText }}" existe déjà.</v-card-title>
                            <div class="my-4 pa-2 overflow-x-auto d-flex flex-nowrap hide-scroll-bar">
                                <v-sheet v-for="(item, index) in wordStore.words.filter(word => word.word === rectoText && word.type === type)" :key="index" width="15vw" height="25vh" class="flex-shrink-0">
                                    <p>{{ index + 1 }}</p>
                                    <v-divider :thickness="1" color="info" class="my-2"></v-divider>
                                    <p>{{ item.explanation }}</p>
                                </v-sheet>
                            </div>
                            <v-card-actions>
                                <v-btn color="light-green-darken-4" @click="ajouter" :disabled="alertStore.loading">
                                    Ajouter quand même
                                </v-btn>
                                <v-btn color="success" @click="rajouterOverlay = false" :disabled="alertStore.loading">
                                    Annuler
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-overlay>

                    <div id="recto-verso">
                        <v-card width="42%" class="recto-card rounded-xl pa-4 elevation-4 overflow-y-auto hide-scroll-bar">
                            <v-card-title class="text-h6">Le recto</v-card-title>
                            <v-card-text>
                                <v-divider :thickness="2" color="info" length="84%" class="mb-4"></v-divider>
                                <v-textarea
                                    density="compact"
                                    label="Saisir le mot sur le recto"
                                    variant="underlined"
                                    hide-details
                                    single-line
                                    :auto-grow="isDesktop"
                                    :rows="4"
                                    :max-rows="isDesktop ? null : 4"
                                    color="cyan-darken-4"
                                    clearable
                                    v-model="rectoText"
                                ></v-textarea>
                            </v-card-text>
                        </v-card>
                        <v-card width="42%" class="verso-card rounded-xl pa-4 elevation-4 overflow-y-auto hide-scroll-bar">
                            <v-card-title>
                                <div id="verso-title">
                                    <p style="display: inline-block;" class="text-h6">
                                        Le verso
                                    </p>
                                    <div style="display: inline-block;">
                                        <v-radio-group density="comfortable" inline :hide-details="true" v-model="type">
                                            <v-radio label="active" value="active"></v-radio>
                                            <v-radio label="passive" value="passive"></v-radio>
                                        </v-radio-group>
                                    </div>
                                    <transition name="fly-in-left">
                                        <div style="display: inline-block;" v-show="type && rectoText && versoText">
                                            <v-btn @click="handleAjouter" rounded="xl" size="small" color="black" :disabled="alertStore.loading">ajouter</v-btn>
                                        </div>
                                    </transition>
                                </div>
                            </v-card-title>
                            <v-card-text>
                                <v-divider :thickness="2" color="info" length="84%" class="mb-4"></v-divider>
                                <v-textarea
                                    density="compact"
                                    label="Saisir l'explication sur le verso"
                                    variant="underlined"
                                    hide-details
                                    single-line
                                    :auto-grow="isDesktop"
                                    :rows="4"
                                    :max-rows="isDesktop ? null : 4"
                                    color="cyan-darken-4"
                                    clearable
                                    v-model="versoText"
                                ></v-textarea>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </v-col>
            <v-col cols="12" md="4" class="pa-2">
                <div v-if="currCard.length > 0">
                    <v-btn prepend-icon="mdi-backspace-outline" variant="tonal" block @click="backToTab" :disabled="alertStore.loading">Back</v-btn>

                    <wordCard 
                    :cardType="cardCurrType"
                    :learnStatus="learnStatus"
                    :word="currCard"
                    :reversedWord="reversedWordFlag"
                    @nextCard="nextCard"
                    ></wordCard>
                </div>
                <v-card elevation="4" v-else>
                    <v-tabs color="primary" v-model="tab" align-tabs="center">
                        <v-tab value="a">Mots Actives</v-tab>
                        <v-tab value="p">Mots Passives</v-tab>
                    </v-tabs>

                    <v-divider></v-divider>

                    <v-window v-model="tab">
                        <v-window-item value="a">
                            <v-card class="pa-5">
                                <div v-if="wordStore && wordStore.activeWordsStruct.wordsToLearnCount > 0">
                                    <StartButton @init="initReviewQueue('active,new')" preIcon="mdi-pen" color="purple-darken-2" :loading="alertStore.loading">NEW: {{ wordStore.activeWordsStruct.wordsToLearnCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-pen" color="grey" :loading="alertStore.loading">Pas de nouveaux mots</StartButton>
                                </div>

                                <div v-if="wordStore && wordStore.activeWordsStruct.wordsToReviewCount > 0">
                                    <StartButton @init="initReviewQueue('active,review')" preIcon="mdi-refresh" color="lime-darken-3" :loading="alertStore.loading">A REVISER: {{ wordStore.activeWordsStruct.wordsToReviewCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-refresh" color="grey" :loading="alertStore.loading">Pas de mots à réviser</StartButton>
                                </div>
                            </v-card>
                        </v-window-item>
                        <v-window-item value="p">
                            <v-card class="pa-5">
                                <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToLearnCount > 0">
                                    <StartButton @init="initReviewQueue('passive,new')" preIcon="mdi-pen" color="purple-darken-2" :loading="alertStore.loading">NEW: {{ wordStore.passiveWordsStruct.wordsToLearnCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-pen" color="grey" :loading="alertStore.loading">Pas de nouveaux mots</StartButton>
                                </div>

                                <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToReviewCount > 0">
                                    <StartButton @init="initReviewQueue('passive,review')" preIcon="mdi-refresh" color="lime-darken-3" :loading="alertStore.loading">A REVISER: {{ wordStore.passiveWordsStruct.wordsToReviewCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-refresh" color="grey" :loading="alertStore.loading">Pas de mots à réviser</StartButton>
                                </div>
                            </v-card>
                        </v-window-item>
                    </v-window>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useWordStore, useAlertStore } from '@/stores';
import StartButton from '@/components/StartButton.vue';
import wordCard from '@/components/wordCard.vue';
import { axiosWrapper } from '../utilities/axios-wrapper';

const type = ref("active");
const rectoText = ref("");
const versoText = ref("");
const tab = ref("a");
const currCard = ref([]);
const cardCurrType = ref("");
const learnStatus = ref("");
const rajouterOverlay = ref(false); // 重复添加时添加询问
const reversedWordFlag = ref(false);

const { mdAndUp: isDesktop } = useDisplay();

let wordStore = null;
let alertStore = null;

let reviewWordLength = 0;

async function handleAjouter() {
    if (wordStore !== null) {
        // 确认词汇存在与否，如果已存在，就询问是否重复添加
        const existingWord = wordStore.findWord(rectoText.value, type.value);
        if (existingWord) {
            rajouterOverlay.value = true;
        }
        else {
            await ajouter();
        }
    }
}

async function ajouter(){
    if (wordStore === null || alertStore === null) return;

    alertStore.setLoading(true);
    try {
        await wordStore.addWord({
            word: rectoText.value,
            explanation: versoText.value,
            type: type.value,
            word_group: 1
        });
        rajouterOverlay.value = false;
        rectoText.value = "";
        versoText.value = "";
        type.value = "active";
    } finally {
        alertStore.setLoading(false);
    }
}

async function initReviewQueue(type) {
    if (wordStore !== null && alertStore !== null && typeof type === 'string' && type.match(/^(active|passive),(new|review)$/)) {
        alertStore.setLoading(true);
        try {
        // 卡片类型会变的（在review中两种都会出现，但是学习新词时只能是learn），所以分开管理
        cardCurrType.value = type.split(',')[1] === 'new' ? 'learn' : 'review';
        learnStatus.value = type.split(',')[1];
        wordStore.resetQueue();
        reviewWordLength = wordStore.initReviewQueue(type.split(',')[0], type.split(',')[1]);
        wordStore.reviewWordLimitPosition = reviewWordLength;
        const nextWord = wordStore.peekCurrent();
        
        currCard.value = await conbineShowWords(nextWord, wordStore.reviewQueue);
        wordStore.reviewWordCount = 0;

        console.log("初始化复习队列，当前的review队列：", wordStore.reviewQueue, "当前要展示的词汇是", currCard);
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function nextCard() {
    // console.log("进入nextCard");
    if (wordStore !== null) {
        // review模式在末尾会切换成learn模式
        if (cardCurrType.value === 'review') {
            // console.log("复习队列已复习单词数量：", wordStore.reviewWordCount, "/", reviewWordLength);
            if (cardCurrType.value === 'review' && wordStore.reviewWordCount >= reviewWordLength) {
                // console.log("复习队列单词已全部复习，切换到learn模式");
                cardCurrType.value = 'learn';
            }
        }

        // learn模式下会有记忆窗口，review下没有
        let nextWord = null;
        // console.log("当前的卡片类型", cardCurrType.value)
        if (cardCurrType.value === 'learn') {
            if (!wordStore.isWindowEmpty()) {
                // 现在处于learn模式并且window不空
                // 先判断memory是否复习完了，如果memory看完了就要继续看word队列里的
                // console.log("learn模式下且window不空");
                if (wordStore.isWindowEnd()) {
                    // console.log("memory窗口看完了，继续看word队列，这个时候下一个词汇是从word队列里取出：");
                    nextWord = wordStore.peekCurrent();
                    if (!nextWord) await closeCard();
                    else currCard.value = await conbineShowWords(nextWord, wordStore.reviewQueue);
                }
                else {
                    // 如果取出的词汇在前面有同样的word，那么在前面已经看过的部分肯定一起展示了这个当前的词汇，需要跳过本次nextCard
                    nextWord = wordStore.peekMemory();
                    if (wordStore.memoryWindowProgressTempWordList[nextWord.word] && wordStore.memoryWindowProgressTempWordList[nextWord.word].some(w => w.explanation === nextWord.explanation)){
                        // console.log("这个词汇之前复习过了，跳过")
                        await nextCard();
                        return;
                    }
                    currCard.value = await conbineShowWords(nextWord, wordStore.memoryWindow);
                }
            } else {
                // console.log("learn模式下但window空了，直接从word队列里取出单词：");
                nextWord = wordStore.peekCurrent();
                if (!nextWord) await closeCard();
                else currCard.value = await conbineShowWords(nextWord, wordStore.reviewQueue);
            }
        }
        else {
            // console.log("当前卡片类型是review，不需要window队列");
            nextWord = wordStore.peekCurrent();
            // console.log("[review]阶段，从review队列取出的下一个词汇：", nextWord, "当前的review队列：", wordStore.reviewQueue);
            if (!nextWord) await closeCard();
            else {
                const showWords = await conbineShowWords(nextWord, wordStore.reviewQueue);
                // console.log("[review]阶段，合并展示的词汇：", showWords);
                const reviewQueueRelearnWords = wordStore.reviewQueue.slice(wordStore.reviewWordLimitPosition, wordStore.reviewQueue.length); // 复习队列中需要重新学习的词汇（即之前因为flou或者oublié被放到后面的词汇）
                // console.log("[review]阶段，复习队列中需要重新学习的词汇：", reviewQueueRelearnWords);
                showWords.forEach((word, index, array) => {
                    if (reviewQueueRelearnWords.find(w => w.id === word.id && w.word === word.word && w.explanation === word.explanation)) {
                        // console.log("[review]阶段，这个词汇需要重新学习，我们要把它的needBtn关掉：", word);
                        array[index].__needBtn__ = false;
                    }
                })
                currCard.value = showWords;
            }
        }
    }
}

// 合并展示词汇，输出一个数组用于渲染，做到当前队列的词汇需要操作，合并在一起操作
// 这样就不会出现即学习又复习，不会乱。
async function conbineShowWords(motherWord, currentQueue){
    // 查询所有与motherWord有相同word或者explanation的词汇，然后输出一个数组用于渲染，在后端还要先判断原词汇还是倒转词汇
    // 后端查到的，不在现在的渲染列表里的词汇都是直接prochain，不用交互
    let allRelatedWords;
    
    if (!motherWord.__isReversed__) {
        allRelatedWords = await axiosWrapper.get(`/word/related?id=${motherWord.id}`);
        console.log("[合并词汇中] 查询到的所有相关词汇：", allRelatedWords);
    } else {
        console.log("词汇是倒转词，不需要查询相关词汇");
        allRelatedWords = {
            wordtype: 'reversed',
            relatedWords: [motherWord]
        };
    }
    // wordStore.word里有的词汇都属于needBtn = true的词汇，说明他们是现在需要复习的词汇，其他的都不需要
    const { wordtype, relatedWords }  = allRelatedWords;

    const isReversed = motherWord.__isReversed__;
    reversedWordFlag.value = !!isReversed;

    if (!isReversed) {
        console.log("[合并词汇中] 不是倒转词，当前队列：", currentQueue, "待合并的相关词汇：", relatedWords);
        const showWords = relatedWords.map(word => {
            const inCurrentStore = currentQueue.find(w => w.word === word.word && w.explanation === word.explanation); // 只要word和explanation都相同就行，不管有没有倒转，就可以说明这个词汇是否正在被访问
            return {
                ...word,
                __needBtn__: !!inCurrentStore
            }
        });
        showWords.sort((a, b) => {
            // 先按照needBtn排序，false在前
            if (a.__needBtn__ === b.__needBtn__) {
                return 0;
            }
            return a.__needBtn__ ? 1 : -1;
        })
        return showWords;
    } else {
        // 倒转的词汇没必要设置
        return [motherWord];
    }
}

async function backToTab() {
    currCard.value = [];
    reviewWordLength = 0;
    wordStore.reviewWordCount = 0;
    cardCurrType.value = "";
    learnStatus.value = "";

    if (wordStore !== null && alertStore !== null) {
        alertStore.setLoading(true);
        try {
            wordStore.resetQueue();
            await wordStore.fetchWords();
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function closeCard() {
    if (alertStore !== null) alertStore.setLoading(true);
    try {
        if (learnStatus.value === 'new') {
            // 学习新词：需要把记忆窗口中剩余未处理的词汇做一次集中更新
            await wordStore.updateRestMemory();
        } else {
            wordStore.cleanupReviewTemp();
        }

        await backToTab();
    } finally {
        if (alertStore !== null) alertStore.setLoading(false);
    }
}

onMounted(() => {
    wordStore = useWordStore();
    wordStore.fetchWords();
    alertStore = useAlertStore();
})
</script>

<style lang="less" scoped>
#left-bg {
    height: 100vh;
    width: 100%;
    background-color: #EEEEEE;

    #recto-verso {
        position: absolute;
        left: 6%;
        top: 8.3%;
        width: 85%;
        height: 83%;

        display: flex;
        justify-content: space-around;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }
}

.hide-scroll-bar::-webkit-scrollbar {
    display: none;
}

#verso-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;

    p {
        align-self: flex-start;
        font-size: 35px;
    }
}

</style>
<style lang="less" scoped>
.fly-in-left-enter-active,
.fly-in-left-leave-active {
    transition: transform 200ms ease, opacity 200ms ease;
}
.fly-in-left-enter-from,
.fly-in-left-leave-to {
    transform: translateX(-16px);
    opacity: 0;
}
.fly-in-left-enter-to,
.fly-in-left-leave-from {
    transform: translateX(0);
    opacity: 1;
}
</style>

<style lang="less" scoped>
@media (max-width: 960px) {
    #recto-verso {
        width: 100%;
        height: auto;
        left: 0;
        top: 0;
        padding: 12px;
        justify-content: center;
    }

    #recto-verso .recto-card,
    #recto-verso .verso-card {
        width: 100% !important;
        height: auto !important;
    }
}
@media (min-width: 960px) {
    #recto-verso .recto-card,
    #recto-verso .verso-card {
        height: 100% !important;
    }
}
</style>