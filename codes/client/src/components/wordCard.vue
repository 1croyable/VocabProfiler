<template>
    <div style="margin-top: 10vh;">
        <v-card height="65vh" width="82%" class="mx-auto px-4 pt-4 rounded-xl elevation-12" color="black">
            <v-card-text>
                <div class="card-content">
                    <div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: center;">
                        <ol>
                            <li v-for="(item, index) in rectos" :key="index">
                                <p class="text-center" style="height: auto; font-size: 1.2rem; line-height: 1.6rem;">
                                    {{ item.word || item }}
                                </p>
                            </li>
                        </ol>
                    </div>
                    <div style="width: 90%">
                        <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                        <v-card-actions>
                            <v-btn color="#A4A4A4" block variant="text" @click="verso = true">Cliquez pour voir le verso</v-btn>
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
                                        <v-btn color="teal-accent-4 mr-2" icon="mdi-backspace" @click="verso = false"></v-btn>
                                    </v-card-actions>
                                </div>  
                            </div>

                            <div v-if="!props.reversedWord" class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 25vw;">
                                <div v-for="(item, index) in versos" :key="index">
                                    <div class="d-flex mx-2" style="width: 22vw; height: 100%;">
                                        <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                            <div style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                                <p class="text-medium-emphasis mb-4 pl-1" style="font-size: 1.1rem; line-height: 1.2rem;">
                                                    {{ item.explanation }}
                                                </p>
                                            </div>
                                            <div v-if="item.__needBtn__">
                                                <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                                <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center">
                                                    <v-btn @click="learnRetenu(item)" color="green accent-4 mr-3" variant="text">Retenu</v-btn>
                                                    <v-btn @click="ARevoir(item)" color="red accent-4 ml-3" variant="text">À revoir</v-btn>
                                                </v-card-actions>
                                                <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center">
                                                    <v-btn @click="reviewMatriser(item)" color="blue accent-4" variant="text">Maîtrisé</v-btn>
                                                    <v-btn @click="reviewFlou(item)" color="#BEC832" variant="text">Flou</v-btn>
                                                    <v-btn @click="reviewOublie(item)" color="red accent-4 ml-3" variant="text">Oublié</v-btn>
                                                </v-card-actions>
                                            </div>
                                        </div>
                                        <v-divider color="red" opacity=".7" thickness="3" gradient vertical></v-divider>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="overflow-x-auto hide-scroll-bar align-self-start d-flex flex-nowrap" style="height: 100%; width: 25vw;">
                                <!-- 是倒转词，应该是多个意思对应一个词汇，按钮总是显示，因为这个词汇是列表里的，就算某些意义不在列表里 -->
                                    <div class="d-flex mx-2" style="width: 22vw; height: 100%;">
                                    <div style="width: 100%; height: 100%;" class="d-flex flex-column justify-space-between flex-shrink-0">
                                        <div style="width: 100%; flex: 1 1 auto; overflow-y: auto;">
                                            <p class="text-medium-emphasis mb-4 pl-1" style="font-size: 1.1rem; line-height: 1.2rem;">
                                                {{ props.word[0].explanation }}
                                            </p>
                                        </div>
                                        <div>
                                            <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                            <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center">
                                                <v-btn @click="learnRetenu(props.word[0])" color="green accent-4 mr-3" variant="text">Retenu</v-btn>
                                                <v-btn @click="ARevoir(props.word[0])" color="red accent-4 ml-3" variant="text">À revoir</v-btn>
                                            </v-card-actions>
                                            <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center">
                                                <v-btn @click="reviewMatriser(props.word[0])" color="blue accent-4" variant="text">Maîtrisé</v-btn>
                                                <v-btn @click="reviewFlou(props.word[0])" color="#BEC832" variant="text">Flou</v-btn>
                                                <v-btn @click="reviewOublie(props.word[0])" color="red accent-4 ml-3" variant="text">Oublié</v-btn>
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
import { useWordStore } from '@/stores';

const verso = ref(false);
const wordStore = useWordStore();

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
        return props.word[0].word.split(' / ');
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

const versos = computed(() => {
    const seenExplanations = new Set();
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
        let needNext = true;
        props.word.forEach((item, index) => {
            if (item.__needBtn__) {
                needNext = false;
            }
        });
        if (needNext) {
            console.log("触发nextCard事件");
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
    console.log(item.word, "被点击")
    // 针对 位于词汇队列中的词汇和位于记忆队列中的词汇有不同的操作
    const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
    if (index !== -1) {
        // console.log("词汇位于词汇队列，位置索引：", index, "于是将word队列的这个词汇提出到记忆窗口");
        // 词汇位于词汇队列
        // 踢出词汇队列
        wordStore.dropFromReviewQueue(item);
        // 但凡是双选界面，就是在学习/复习，都要加入 memoryWindow
        wordStore.enqueueToWindow(item, props.learnStatus === 'new', versos.value.length > 1); // 根据学习新词还是复习词汇中的learn有不同的处理，如果是学习新词，需要更新词汇的数据库状态，如果是复习词汇，则只需踢出队列
        console.log("这个词汇位于词汇队列，点击了记住了，提出到记忆窗口，当前记忆窗口：", wordStore.memoryWindow);
    } else {
        // 位于记忆队列，点击确定后加入临时状态
        if (versos.value.length > 1) {
            wordStore.memoryWindowProgressTempWordList[item.word] = wordStore.memoryWindowProgressTempWordList[item.word] || [];
            wordStore.memoryWindowProgressTempWordList[item.word].push(item);
            console.log("这个词汇位于记忆队列，点击了记住了，加入临时状态，当前这个词汇的临时状态列表：", wordStore.memoryWindowProgressTempWordList[item.word]);
        }
    }
    // console.log("加载下一张卡片，如果不位于词汇队列，但是刚才又复习到了，说明在记忆队列，直接加载下一个，不用处理队列");
    item.__needBtn__ = false;
}

function ARevoir(item) {
    // 也要根据位于词汇队列还是记忆队列区分
    const index = wordStore.reviewQueue.findIndex(w => w.id === item.id && w.word === item.word);
    if (index !== -1) wordStore.aRevoirRQ(item);
    else wordStore.aRevoirMQ(item);

    item.__needBtn__ = false;
}

async function reviewMatriser(item) {
    /*
        这里的问题是，如果这个单词是active的，那么掌握的标准应该是双向都记住
        我们不能通过单纯的id进行判断是否记住了背面，因为比如出现3个单词的word都是相同的但是又3个不同的个解释，那么就会出现混淆
        解决的办法是：不论什么时候复习到倒转意义，如果记住了，就标记为1，表示记住了反过来的解释，这个第一次时候直接把之前所有记住过的正向词汇更新状态
        并且在之后的所有正向词汇被记住时都直接更新状态
    */
    if (wordStore !== null) {
        // 有倒转词，一定是active，要判断这一点
        if (props.reversedWord) {
            wordStore.activeWordsReversedWordFlagWhenReview[item.explanation] = 1;
            if (wordStore.activeWordsProgressTempWordList[item.explanation]) {
                console.log("之前有记住过这个倒转意义的正向词汇，更新它们的状态，列表：", wordStore.activeWordsProgressTempWordList[item.explanation]);
                for (const word of wordStore.activeWordsProgressTempWordList[item.explanation]) {
                    await wordStore.updateWordStatus(word);
                }
                delete wordStore.activeWordsProgressTempWordList[item.explanation];
            }
        } else {
            // 如果不是倒转词，那么判断，如果是active词汇，那么要做必要措施
            if (item.type === 'active') {
                if (wordStore.activeWordsReversedWordFlagWhenReview[item.word] !== 1) {
                    // 临时存入一个列表
                    if (!wordStore.activeWordsProgressTempWordList[item.word]) wordStore.activeWordsProgressTempWordList[item.word] = [];
                    wordStore.activeWordsProgressTempWordList[item.word].push(item);
                    console.log("之前没有记住过这个词汇的倒转意义，先把这个正向词汇存入临时列表，等待复习过程中如果出现了这个词汇的倒转意义被记住了，再更新它的状态，当前临时列表：", wordStore.activeWordsProgressTempWordList);
                } else {
                    // 已经是1了
                    console.log("之前已经记住过这个词汇的倒转意义了，更新这个正向词汇的状态，", item);
                    await wordStore.updateWordStatus(item);
                }
            } else if (item.type === 'passive') {
                await wordStore.updateWordStatus(item);
            }
        }

        wordStore.dropFromReviewQueue(item);
        wordStore.reviewWordLimitPosition --;
        wordStore.reviewWordCount += 1;
        item.__needBtn__ = false;
    }
}

async function reviewFlou(item) {
    if (wordStore !== null) {
        await wordStore.updateWordStatus(item);
        wordStore.aRevoirRQ(item); // 这个时候虽然更新词汇状态，但还是要把它重新加入队列末尾，今天还要复习
        wordStore.reviewWordCount += 1;
        item.__needBtn__ = false;
    }
}

async function reviewOublie(item) {
    if (wordStore !== null) {
        await wordStore.updateWordStatus(item, 1);
        wordStore.aRevoirRQ(item);
        wordStore.reviewWordCount += 1;
        item.__needBtn__ = false;
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
</style>