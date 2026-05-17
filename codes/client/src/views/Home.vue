<template>
    <v-container fluid class="pa-0" id="container">
        <v-row no-gutters>
            <v-overlay v-model="rajouterOverlay" class="align-center d-flex justify-center" contained>
                <v-card width="60vw">
                    <v-card-title style="font-size: 20px; color: grey;">"{{ rectoText }}" has already been added.</v-card-title>
                    <div class="my-4 pa-2 overflow-x-auto d-flex flex-nowrap hide-scroll-bar">
                        <v-sheet v-for="(item, index) in duplicateWords" :key="index" width="15vw" height="25vh" class="flex-shrink-0">
                            <p>Explication {{ index + 1 }}</p>
                            <v-divider :thickness="1" color="info" class="my-2"></v-divider>
                            <p class="preserve-breaks">{{ item.explanation }}</p>
                        </v-sheet>
                    </div>
                    <v-card-actions>
                        <v-btn color="light-green-darken-4" @click="ajouter" :disabled="alertStore.loading">
                            Add Anyway
                        </v-btn>
                        <v-btn color="success" @click="close" :disabled="alertStore.loading">
                            Cancel
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-overlay>
            <v-col cols="12" md="8" class="pa-0">
                <div id="left-bg" class="position-relative display-flex align-center justify-center flex-wrap">
                    <div id="recto-verso">
                        <v-card width="42%" class="recto-card rounded-xl pa-4 elevation-4 overflow-y-auto hide-scroll-bar">
                            <v-card-title class="text-h6">The recto</v-card-title>
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
                                        The verso
                                    </p>
                                    <div style="display: inline-block;">
                                        <v-radio-group :disabled="alertStore.loading" density="comfortable" inline :hide-details="true" v-model="type">
                                            <v-radio label="active" value="active"></v-radio>
                                            <v-radio label="passive" value="passive"></v-radio>
                                        </v-radio-group>
                                    </div>
                                    <transition name="fly-in-left">
                                        <div style="display: inline-block;" v-show="type && normalizedRectoText && normalizedVersoText">
                                            <v-btn @click="handleAdd" rounded="xl" size="small" color="black" :disabled="alertStore.loading">Add</v-btn>
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
                                <v-btn :disabled="alertStore.loading" class="mt-2" color="black" v-show="rectoText && versoText" @click="swap" block>Swap the front and back</v-btn>
                            </v-card-text>
                        </v-card>
                    </div>
                </div>
            </v-col>
            <v-col cols="12" md="4" class="pa-2">
                <div id="right-bg" class="my-4 rounded-xl">
                    <div id="card-region">
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
                                <v-tab value="a">Active Words</v-tab>
                                <v-tab value="p">Passive Words</v-tab>
                            </v-tabs>

                            <v-divider></v-divider>

                            <v-window v-model="tab">
                                <v-window-item value="a">
                                    <v-card class="pa-5">
                                        <div v-if="wordStore && wordStore.activeWordsStruct.wordsToLearnCount > 0">
                                            <StartButton @init="initReviewQueue('active,new')" preIcon="mdi-pen" color="purple-darken-2" :loading="alertStore.loading">NEW: {{ wordStore.activeWordsStruct.wordsToLearnCount + " words" }} </StartButton>
                                        </div>
                                        <div v-else>
                                            <StartButton preIcon="mdi-pen" color="grey" :loading="alertStore.loading">No new words</StartButton>
                                        </div>

                                        <div v-if="wordStore && wordStore.activeWordsStruct.wordsToReviewCount > 0">
                                            <StartButton @init="initReviewQueue('active,review')" preIcon="mdi-refresh" color="lime-darken-3" :loading="alertStore.loading">TO REVIEW: {{ wordStore.activeWordsStruct.wordsToReviewCount + " words" }} </StartButton>
                                        </div>
                                        <div v-else>
                                            <StartButton preIcon="mdi-refresh" color="grey" :loading="alertStore.loading">No words to review</StartButton>
                                        </div>
                                    </v-card>
                                </v-window-item>
                                <v-window-item value="p">
                                    <v-card class="pa-5">
                                        <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToLearnCount > 0">
                                            <StartButton @init="initReviewQueue('passive,new')" preIcon="mdi-pen" color="purple-darken-2" :loading="alertStore.loading">NEW: {{ wordStore.passiveWordsStruct.wordsToLearnCount + " words" }} </StartButton>
                                        </div>
                                        <div v-else>
                                            <StartButton preIcon="mdi-pen" color="grey" :loading="alertStore.loading">No new words</StartButton>
                                        </div>

                                        <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToReviewCount > 0">
                                            <StartButton @init="initReviewQueue('passive,review')" preIcon="mdi-refresh" color="lime-darken-3" :loading="alertStore.loading">TO REVIEW: {{ wordStore.passiveWordsStruct.wordsToReviewCount + " words" }} </StartButton>
                                        </div>
                                        <div v-else>
                                            <StartButton preIcon="mdi-refresh" color="grey" :loading="alertStore.loading">No words to review</StartButton>
                                        </div>
                                    </v-card>
                                </v-window-item>
                            </v-window>
                        </v-card>
                    </div>
                    <div id="tools-region" v-if="currCard.length === 0">
                        <v-btn block type="button" width="40%" @click="logout">Log Out</v-btn>
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useWordStore, useAlertStore, useAuthStore } from '@/stores';
import StartButton from '@/components/StartButton.vue';
import wordCard from '@/components/wordCard.vue';

const type = ref("active");
const rectoText = ref("");
const versoText = ref("");
const tab = ref("a");
const currCard = ref([]);
const cardCurrType = ref("");
const learnStatus = ref("");
const rajouterOverlay = ref(false);
const reversedWordFlag = ref(false);

const { mdAndUp: isDesktop } = useDisplay();

const wordStore = useWordStore();
const alertStore = useAlertStore();
const authStore = useAuthStore();

function normalizeInputChunk(value) {
    return wordStore.normalizeInputText(value);
}

const normalizedRectoText = computed(() => normalizeInputChunk(rectoText.value));
const normalizedVersoText = computed(() => normalizeInputChunk(versoText.value));
const duplicateWords = computed(() => wordStore.findWords(normalizedRectoText.value, type.value));

let reviewWordLength = 0;

async function handleAdd() {
    if (!normalizedRectoText.value || !normalizedVersoText.value) return;
    // 确认词汇存在与否，如果已存在，就询问是否重复添加
    const existingWord = wordStore.findWord(normalizedRectoText.value, type.value);
    if (existingWord) {
        rajouterOverlay.value = true;
    }
    else {
        await ajouter();
    }
}

async function ajouter(){
    if (!normalizedRectoText.value || !normalizedVersoText.value) return;
    alertStore.setLoading(true);
    try {
        await wordStore.addWord({
            word: normalizedRectoText.value,
            explanation: normalizedVersoText.value,
            type: type.value,
            word_group: 1,
            user_id: authStore.user?.id,
        });
        rajouterOverlay.value = false;
        rectoText.value = "";
        versoText.value = "";
        type.value = "active";
    } finally {
        alertStore.setLoading(false);
    }
}

function close(){
    rajouterOverlay.value = false;
    rectoText.value = "";
    versoText.value = "";
    type.value = "active";
}

function swap(){
    const temp = rectoText.value;
    rectoText.value = versoText.value;
    versoText.value = temp;
}

async function initReviewQueue(type) {
    if (typeof type === 'string' && type.match(/^(active|passive),(new|review)$/)) {
        alertStore.setLoading(true);
        try {
            cardCurrType.value = type.split(',')[1] === 'new' ? 'learn' : 'review';
            learnStatus.value = type.split(',')[1];
            wordStore.resetQueue();
            reviewWordLength = wordStore.initReviewQueue(type.split(',')[0], type.split(',')[1]);
            wordStore.reviewWordLimitPosition = reviewWordLength;
            const nextWord = wordStore.peekCurrent();
            
            currCard.value = await conbineShowWords(nextWord, wordStore.reviewQueue);
            wordStore.reviewWordCount = 0;
        } finally {
            alertStore.setLoading(false);
        }
    }
}

async function nextCard() {
    // console.log("进入nextCard");
    alertStore.setLoading(true);
    currCard.value = [{
        id: -1,
        word: "Chargement...",
        explanation: "",
        type: "active",
        level: 0,
        next_review_date: null,
        created_at: "",
        word_group: 1,
        __needBtn__: true,
        __isReversed__: false,
        __loadingPlaceholder__: true,
    }];
    try {
        if (cardCurrType.value === 'review') {
            if (cardCurrType.value === 'review' && wordStore.reviewWordCount >= reviewWordLength) {
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
    } finally {
        alertStore.setLoading(false);
    }
}

async function conbineShowWords(motherWord, currentQueue){
    let relatedWords;
    
    if (!motherWord.__isReversed__) {
        relatedWords = wordStore.findRelatedWordsById(motherWord.id);
    } else {
        relatedWords = [motherWord];
    }

    const isReversed = motherWord.__isReversed__;
    reversedWordFlag.value = !!isReversed;

    if (!isReversed) {
        const showWords = relatedWords.map(word => {
            const inCurrentStore = currentQueue.find(w => w.word === word.word && w.explanation === word.explanation);
            return {
                ...word,
                __needBtn__: !!inCurrentStore
            }
        });
        showWords.sort((a, b) => {
            if (a.__needBtn__ === b.__needBtn__) {
                return 0;
            }
            return a.__needBtn__ ? 1 : -1;
        })
        return showWords;
    } else {
        return [motherWord];
    }
}

async function backToTab() {
    currCard.value = [];
    reviewWordLength = 0;
    wordStore.reviewWordCount = 0;
    cardCurrType.value = "";
    learnStatus.value = "";

    alertStore.setLoading(true);
    try {
        wordStore.resetQueue();
        await wordStore.fetchWords();
    } finally {
        alertStore.setLoading(false);
    }
}

async function closeCard() {
    alertStore.setLoading(true);
    try {
        if (learnStatus.value === 'new') {
            // 学习新词：需要把记忆窗口中剩余未处理的词汇做一次集中更新
            await wordStore.updateRestMemory();
        } else {
            wordStore.cleanupReviewTemp();
        }

        await backToTab();
    } finally {
        alertStore.setLoading(false);
    }
}

onMounted(async () => {
    const user = await authStore.getCurrentUser();

    if (!user) return;
    
    wordStore.fetchWords(user.id);
})

function logout() {
    authStore.logout();
}
</script>

<style lang="less" scoped>
#container {
    background-image: url('/desk_image.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

#left-bg {
    height: 100vh;
    width: 100%;

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

#right-bg {
    height: calc(100% - 32px);
    min-height: calc(65vh + 200px);
    width: 100%;

    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(3px) saturate(60%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
    overflow: hidden;
    border-radius: 16px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.hide-scroll-bar::-webkit-scrollbar {
    display: none;
}

.preserve-breaks {
    white-space: pre-line;
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
    #container {
        background-image: url('/mobile_image.png');
        background-position: top center;
    }

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