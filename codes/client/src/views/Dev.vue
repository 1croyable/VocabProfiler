<template>
    <v-container fluid class="pa-0">
        <v-row no-gutters>
            <v-col cols="12" md="8" class="pa-0">
                <div id="left-bg" class="position-relative">
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
                                            <v-btn @click="ajouter" rounded="xl" size="small" color="black">ajouter</v-btn>
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
                <div v-if="currCard">
                    <v-btn prepend-icon="mdi-backspace-outline" variant="tonal" block @click="backToTab">Back</v-btn>

                    <wordCard 
                    :cardType="cardCurrType"
                    :learnStatus="learnStatus"
                    :word="currCard"
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
                                    <StartButton @init="initReviewQueue('active,new')" preIcon="mdi-pen" color="purple-darken-2">NEW: {{ wordStore.activeWordsStruct.wordsToLearnCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-pen" color="grey">Pas de nouveaux mots</StartButton>
                                </div>

                                <div v-if="wordStore && wordStore.activeWordsStruct.wordsToReviewCount > 0">
                                    <StartButton @init="initReviewQueue('active,review')" preIcon="mdi-refresh" color="lime-darken-3">A REVISER: {{ wordStore.activeWordsStruct.wordsToReviewCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-refresh" color="grey">Pas de mots à réviser</StartButton>
                                </div>
                            </v-card>
                        </v-window-item>
                        <v-window-item value="p">
                            <v-card class="pa-5">
                                <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToLearnCount > 0">
                                    <StartButton @init="initReviewQueue('passive,new')" preIcon="mdi-pen" color="purple-darken-2">NEW: {{ wordStore.passiveWordsStruct.wordsToLearnCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-pen" color="grey">Pas de nouveaux mots</StartButton>
                                </div>

                                <div v-if="wordStore && wordStore.passiveWordsStruct.wordsToReviewCount > 0">
                                    <StartButton @init="initReviewQueue('passive,review')" preIcon="mdi-refresh" color="lime-darken-3">A REVISER: {{ wordStore.passiveWordsStruct.wordsToReviewCount + " mots" }} </StartButton>
                                </div>
                                <div v-else>
                                    <StartButton preIcon="mdi-refresh" color="grey">Pas de mots à réviser</StartButton>
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
import { useWordStore } from '@/stores';
import StartButton from '@/components/StartButton.vue';
import wordCard from '@/components/wordCard.vue';

const type = ref("active");
const rectoText = ref("");
const versoText = ref("");
const tab = ref("a");
const currCard = ref(null);
const cardCurrType = ref("");
const learnStatus = ref("");

const { mdAndUp: isDesktop } = useDisplay();

let queueLength = 0;
let reviewWordCount = 0; // 用来记录复习队列中已经复习过的单词数量，进而区分第一次复习还是循环复习

let wordStore = null;

async function ajouter() {
    if (wordStore !== null) {
        await wordStore.addWord({
            word: rectoText.value,
            explanation: versoText.value,
            type: type.value,
            word_group: 1
        });
        rectoText.value = "";
        versoText.value = "";
        type.value = "active";
    }
}

function initReviewQueue(type) {
    if (wordStore !== null && typeof type === 'string' && type.match(/^(active|passive),(new|review)$/)) {
        // 卡片类型会变的（在review中两种都会出现，但是学习新词时只能是learn），所以分开管理
        cardCurrType.value = type.split(',')[1] === 'new' ? 'learn' : 'review';
        learnStatus.value = type.split(',')[1];
        wordStore.resetQueue();
        queueLength = wordStore.initReviewQueue(type.split(',')[0], type.split(',')[1]);
        currCard.value = wordStore.peekCurrent() ?? null;
        reviewWordCount = 0;
    }
}

function nextCard() {
    if (wordStore !== null) {
        // learn模式下会有记忆窗口，review下没有
        let nextWord = null;

        if (cardCurrType.value === 'learn' && !wordStore.isWindowEmpty()) {
            // 现在处于learn模式并且window不空
            // 先判断memory是否复习完了，富国memory看完了就要继续看word队列里的
            console.log("learn模式下且window不空");
            if (wordStore.isWindowEnd()) {
                console.log("memory窗口看完了，继续看word队列");
                nextWord = wordStore.peekCurrent();
                console.log("nextWord:", nextWord);
                if (!nextWord) closeCard();
                else currCard.value = nextWord;
            }
            else {
                console.log("memory窗口没有看完，从memory窗口取出单词:", currCard.value);
                currCard.value = wordStore.peekMemory();
            }
        }
        else {
            nextWord = wordStore.peekCurrent();
            if (!nextWord) closeCard();
            else currCard.value = nextWord
        }
        
        // review模式在末尾会切换成learn模式
        if (cardCurrType.value === 'review') {
            reviewWordCount += 1;
            if (cardCurrType.value === 'review' && reviewWordCount >= queueLength) {
                cardCurrType.value = 'learn';
            }
        }
    }
}

function backToTab() {
    currCard.value = null;
    queueLength = 0;
    reviewWordCount = 0;
    cardCurrType.value = "";
    learnStatus.value = "";

    if (wordStore !== null) {
        wordStore.resetQueue();
        wordStore.fetchWords();
    }
}

function closeCard() {
    if (learnStatus.value === 'new') wordStore.updateRestMemory();

    backToTab();
}

onMounted(() => {
    wordStore = useWordStore();
    wordStore.fetchWords();
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