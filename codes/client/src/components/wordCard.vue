<template>
    <div style="margin-top: 10vh;">
        <v-card height="65vh" width="82%" class="mx-auto px-4 pt-4 rounded-xl elevation-12" color="black">
            <v-card-text>
                <div class="card-content">
                    <div style="flex: 1 1 auto; display: flex; align-items: center; justify-content: center;">
                        <p class="text-center" style="height: auto; font-size: 1.4rem; line-height: 1.6rem;">
                            {{ props.word.word }}
                        </p>
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
                <v-card v-if="verso" class="position-absolute w-100 rounded-xl" height="100%" style="bottom: 0; left: 0;">
                    <v-card-text>
                        <div class="card-content">
                            <div class="align-self-start" style="width: 100%;">
                                <div class="d-flex flex-space-between" style="width: 100%;">
                                    <p class="text-h5" style="flex: 1 1 auto;">Explication</p>
                                    <v-card-actions class="pa-0">
                                        <v-btn color="teal-accent-4 mr-2" icon="mdi-backspace" @click="verso = false"></v-btn>
                                    </v-card-actions>
                                </div>
                                
                                <p class="text-medium-emphasis mb-4 pl-1" style="font-size: 1.1rem; line-height: 1.2rem;">
                                    {{ props.word.explanation }}
                                </p>
                            </div>
                            <div style="width: 90%;">
                                <v-divider class="my-4 solid-divider" color="#DEDEDE" :thickness="0.5" length="100%"></v-divider>
                                <v-card-actions v-if="props.cardType === 'learn'" class="d-flex justify-center">
                                    <v-btn @click="learnRetenu" color="green accent-4 mr-3" variant="text">Retenu</v-btn>
                                    <v-btn @click="ARevoir" color="red accent-4 ml-3" variant="text">À revoir</v-btn>
                                </v-card-actions>
                                <v-card-actions v-else-if="props.cardType === 'review'" class="d-flex justify-center">
                                    <v-btn @click="reviewMatriser" color="blue accent-4" variant="text">Maîtrisé</v-btn>
                                    <v-btn @click="reviewFlou" color="#BEC832" variant="text">Flou</v-btn>
                                    <v-btn @click="reviewOublie" color="red accent-4 ml-3" variant="text">Oublié</v-btn>
                                </v-card-actions>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-expand-transition>
        </v-card>
    </div>
</template>

<script setup>
import { ref } from 'vue';
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
        type: Object,
        required: true,
    },
    learnStatus: {
        type: String,
        required: true,
    }
});

async function learnRetenu() {
    // 针对 位于词汇队列中的词汇和位于记忆队列中的词汇有不同的操作
    const index = wordStore.reviewQueue.findIndex(w => w.id === props.word.id && w.word === props.word.word);
    // console.log("寻找词汇在word词汇队列中的位置，index =", index);
    if (index !== -1) {
        // console.log("词汇位于词汇队列，位置索引：", index, "于是将word队列的这个词汇提出到记忆窗口");
        // 词汇位于词汇队列
        // 踢出词汇队列
        wordStore.deleteHead();
        // 但凡是双选界面，就是在学习/复习，都要加入 memoryWindow
        wordStore.enqueueToWindow(props.word, props.learnStatus === 'new'); // 根据学习新词还是复习词汇中的learn有不同的处理，如果是学习新词，需要更新词汇的数据库状态，如果是复习词汇，则只需踢出队列
    }
    // 加载下一张，位于记忆队列直接加载下一个
    // console.log("加载下一张卡片，如果不位于词汇队列，但是刚才又复习到了，说明在记忆队列，直接加载下一个，不用处理队列");
    emit('nextCard');
    verso.value = false;
}

function ARevoir() {
    // 也要根据位于词汇队列还是记忆队列区分
    const index = wordStore.reviewQueue.findIndex(w => w.id === props.word.id && w.word === props.word.word);
    console.log("寻找词汇在word词汇队列中的位置，index =", index);
    if (index !== -1) wordStore.aRevoirRQ(props.word);
    else wordStore.aRevoirMQ(props.word);

    emit('nextCard');
    verso.value = false;
}

async function reviewMatriser() {
    if (wordStore !== null) {
        await wordStore.updateWordStatus(props.word);
        wordStore.deleteHead();
        emit('nextCard');
        verso.value = false;
    }
}

async function reviewFlou() {
    if (wordStore !== null) {
        await wordStore.updateWordStatus(props.word);
        
        wordStore.aRevoir(props.word); // 这个时候虽然更新词汇状态，但还是要把它重新加入队列末尾，今天还要复习

        emit('nextCard');
        verso.value = false;
    }
}

async function reviewOublie() {
    if (wordStore !== null) {
        await wordStore.updateWordStatus(props.word, 1);
        wordStore.aRevoir(props.word);
        emit('nextCard');
        verso.value = false;
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
</style>