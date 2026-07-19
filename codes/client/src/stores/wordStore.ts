import { defineStore } from 'pinia';
import { reactive, toRaw } from 'vue';
import { axiosWrapper } from '../utilities/axios-wrapper';
import { WordList, WordPayload, WordItem } from '../type';
import dayjs from 'dayjs';
import { useAuthStore } from './authStore';

export const useWordStore = defineStore('word', {
    state: () => ({
        currentNotebook: null as { id: number; name: string } | null,
        notebooks: [] as Array<{ id: number; name: string }>,
        words: [] as WordList,
        activeWordsStruct: {},
        passiveWordsStruct: {},
        reviewQueue: [] as WordList,
        memoryWindow: [] as WordList,
        memoryReviewKey: 0,
        activeWordsReversedWordFlagWhenLearn: {} as Record<string, number>,
        activeWordsProgressTempWordListWhenLearn: {} as Record<string, Array<WordItem>>,
        reviewWordCount: 0, // 用来记录复习队列中已经复习过的单词数量，进而区分第一次复习还是循环复习
        reviewWordLimitPosition: 0,
        maxMemoryWindowLength: 5,
        memoryWindowProgressTempWordList: {} as Record<string, Array<WordItem>>,
        // 为了复习过程中的状态更新设置的临时列表
        reviewActiveWordStatusList: {} as Record<string, number>, // 这里的string是word, explanation的组合，因为要分辨正向词汇的多个意义
        reviewActiveWordReversedStatusList: {} as Record<string, number>,
    }),
    actions: {
        normalizeInputText(value: string) {
            return (value ?? '').replace(/\r\n/g, '\n').trim();
        },
        async fetchWords() {
            const authStore = useAuthStore();
            if (!authStore.user?.id) {
                console.error('User ID is required to fetch words');
                return;
            }

            if (this.currentNotebook === null)
            {
                // 查询用户的默认笔记本
                const notebooks = await axiosWrapper.get<{ id: number; name: string }[]>(`/user/notebooks`);
                this.currentNotebook = notebooks[0];
                this.notebooks = notebooks;
            }

            this.words = await axiosWrapper.get<WordList>(`/word/list?notebook_id=${this.currentNotebook?.id}`);
            this.words = this.words.map(word => ({ ...word, __needBtn__: true, __isReversed__: false }));
            this.rangeWords();
        },
        async addWord(payload: WordPayload) {
            const normalizedPayload = {
                ...payload,
                word: this.normalizeInputText(payload.word),
                explanation: this.normalizeInputText(payload.explanation),
            };

            const newId = await axiosWrapper.post<number>('/word/add', normalizedPayload);

            this.words.push({
                id: newId,
                ...normalizedPayload,
                level: 0,
                next_review_date: null,
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                __needBtn__: true,
                __isReversed__: false
            })

            this.rangeWords();
        },
        rangeWords() {
            const activeWords = this.words.filter(word => word.type === 'active');
            const passiveWords = this.words.filter(word => word.type === 'passive');

            const activeWordsToReview = activeWords.filter(word => word.level > 0).filter(word => {
                if (!word.next_review_date) return false;
                return dayjs(word.next_review_date).isBefore(dayjs().add(1, 'day'), 'day');
            });

            const passiveWordsToReview = passiveWords.filter(word => word.level > 0).filter(word => {
                if (!word.next_review_date) return false;
                return dayjs(word.next_review_date).isBefore(dayjs().add(1, 'day'), 'day');
            });

            this.activeWordsStruct = {
                wordsToLearn: activeWords.filter(word => word.level === 0),
                wordsToLearnCount: activeWords.filter(word => word.level === 0).length,
                wordsToReview: activeWordsToReview,
                wordsToReviewCount: activeWordsToReview.length,
            }
            this.passiveWordsStruct = {
                wordsToLearn: passiveWords.filter(word => word.level === 0),
                wordsToLearnCount: passiveWords.filter(word => word.level === 0).length,
                wordsToReview: passiveWordsToReview,
                wordsToReviewCount: passiveWordsToReview.length,
            }
        },
        shuffle<T>(arr: T[]): T[] {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        getCandidates(type: 'active' | 'passive', mode: 'new' | 'review'): WordList {
            const struct = type === 'active' ? (this.activeWordsStruct as any) : (this.passiveWordsStruct as any);
            if (!struct) return [];
            return mode === 'new' ? (struct.wordsToLearn || []) : (struct.wordsToReview || []);
        },
        buildActiveReverseCandidates(candidates: WordList): WordList {
            const reverseCandidates = candidates.map((word: WordItem) => {
                const raw = toRaw(word);

                return reactive({
                    ...raw,
                    word: raw.explanation,
                    explanation: raw.word,
                    __isReversed__: true,
                }) as WordItem;
            });

            return reverseCandidates.filter((word, index, words) =>
                words.findIndex(reverseCandidate => reverseCandidate.explanation === word.explanation) === index
            );
        },
        initReviewQueue(type: 'active' | 'passive', mode: 'new' | 'review') {
            this.rangeWords();
            const candidates = this.getCandidates(type, mode);
            let thisTurnWords = [] as WordList;

            if (type === 'active') {
                const forwardCandidates = this.shuffle(candidates).slice(0, 10);
                const reverseCandidates = this.buildActiveReverseCandidates(forwardCandidates);
                thisTurnWords = this.shuffle([...forwardCandidates, ...reverseCandidates]);
            } else {
                thisTurnWords = this.shuffle(candidates).slice(0, 20);
            }

            this.reviewQueue = thisTurnWords;
            this.adapteActiveWordReversedWordOrder();
            this.activeWordsReversedWordFlagWhenLearn = {};
            this.reviewActiveWordReversedStatusList = {};
            this.reviewActiveWordStatusList = {};
            this.memoryWindowProgressTempWordList = {};
            this.reviewWordCount = 0;
            this.reviewWordLimitPosition = 0;
            return this.reviewQueue.length;
        },
        adapteActiveWordReversedWordOrder(maxDistance: number = 5) {
            if (!this.reviewQueue.length) return;
            for (let i = 0; i < this.reviewQueue.length; i++) {
                const current = this.reviewQueue[i];
                if (current.__isReversed__) continue;

                const reversedIndex = this.reviewQueue.findIndex(
                    (w, idx) => idx > i && w.__isReversed__ && w.id === current.id
                );

                if (reversedIndex === -1) continue;
                if (reversedIndex <= i + maxDistance) continue;

                const [reversedItem] = this.reviewQueue.splice(reversedIndex, 1);
                const targetIndex = Math.min(i + maxDistance, this.reviewQueue.length);
                this.reviewQueue.splice(targetIndex, 0, reversedItem);
            }
        },
        peekCurrent() {
            if (!this.reviewQueue.length) return null;
            return this.reviewQueue[0] ?? null;
        },
        // 重置队列
        resetQueue() {
            this.reviewQueue = [];
            this.memoryWindow = [];
            this.activeWordsReversedWordFlagWhenLearn = {};
            this.reviewActiveWordReversedStatusList = {};
            this.reviewActiveWordStatusList = {};
            this.memoryWindowProgressTempWordList = {};
            this.reviewWordCount = 0;
            this.reviewWordLimitPosition = 0;
        },
        cleanupReviewTemp() {
            this.reviewActiveWordReversedStatusList = {};
            this.reviewActiveWordStatusList = {};
            this.memoryWindowProgressTempWordList = {};
        },
        async updateWordStatus(word: WordItem, toLevel: number | null = null) {
            if (word.__isReversed__) return;
            
            const id = word.id;
            const wordData = word.word;
            const newLevel = toLevel !== null ? toLevel : Math.min(word.level + 1, 6);
            let nextReviewDate = word.next_review_date;
            switch (newLevel) {
                case 1:
                    nextReviewDate = dayjs().add(1, 'day').format('YYYY-MM-DD'); // level0 - level 1 24小时后复习
                    break;
                case 2:
                    nextReviewDate = dayjs().add(3, 'day').format('YYYY-MM-DD'); // level1 - level 2 3天后复习
                    break;
                case 3:
                    nextReviewDate = dayjs().add(7, 'day').format('YYYY-MM-DD'); // level2 - level 3 7天后复习
                    break;
                case 4:
                    nextReviewDate = dayjs().add(14, 'day').format('YYYY-MM-DD'); // level3 - level 4 14天后复习
                    break;
                case 5:
                    nextReviewDate = dayjs().add(30, 'day').format('YYYY-MM-DD'); // level4 - level 5 30天后复习
                    break;
                case 6:
                    nextReviewDate = dayjs().add(60, 'day').format('YYYY-MM-DD'); // level5 - level 6 60天后复习
                    break;
                default:
                    nextReviewDate = null;
            }

            await axiosWrapper.patch('/word/update-level', {
                id,
                word: wordData,
                level: newLevel,
                next_review_date: nextReviewDate,
            });

            const idx = this.words.findIndex(w => w.id === id);
            if (idx !== -1) {
                this.words[idx] = { ...this.words[idx], level: newLevel, next_review_date: nextReviewDate };
                this.rangeWords();
            }
        },
        dropFromReviewQueue(word: WordItem) {
            this.reviewQueue = this.reviewQueue.filter(w => w.word !== word.word || w.explanation !== word.explanation);
        },
        putToReviewQueue(word: WordItem){
            const newWord = reactive({ ...word }) as WordItem;
            this.dropFromReviewQueue(word);
            this.reviewQueue.push(newWord);
        },
        async enqueueToWindow(word: WordItem, isNew: Boolean, complex: Boolean = false){
            const authStore = useAuthStore();
            if (!authStore.user?.id) {
                console.error('User ID is required to enqueue word');
                return;
            }

            let head = null;

            if (complex && this.maxMemoryWindowLength >= 5) {
                const existingIndex = this.memoryWindow.findIndex(w => w.word === word.word);
                if (existingIndex !== -1) {
                    this.maxMemoryWindowLength++;
                }
            }

            if (this.memoryWindow.length === this.maxMemoryWindowLength && isNew)
                head = this.memoryWindow.shift();

            const newWord = reactive({ ...word }) as WordItem;
            this.memoryWindow.push(newWord);

            if (head && isNew) {
                if (head.__isReversed__) {
                    this.activeWordsReversedWordFlagWhenLearn[head.explanation] = 1;
                    if (this.activeWordsProgressTempWordListWhenLearn[head.explanation]) {
                        this.activeWordsProgressTempWordListWhenLearn[head.explanation].forEach(async w => {
                            await this.updateWordStatus(w);
                        });
                    }
                } else {
                    if (head.type === 'active') {
                        if (this.activeWordsReversedWordFlagWhenLearn[head.word] !== 1) {
                            if (!this.activeWordsProgressTempWordListWhenLearn[head.word]) this.activeWordsProgressTempWordListWhenLearn[head.word] = [];
                            this.activeWordsProgressTempWordListWhenLearn[head.word].push(head);
                        } else {
                            await this.updateWordStatus(head);
                        }
                    } else if (head.type === 'passive') {
                        await this.updateWordStatus(head);
                    }
                }
            }
        },
        isWindowEmpty(){
            return this.memoryWindow.length === 0;
        },
        isWindowEnd(){
            const result = this.memoryReviewKey === this.memoryWindow.length;
            if (result) {
                this.memoryReviewKey = 0;
                this.memoryWindowProgressTempWordList = {};
            }
            return result;
        },
        peekMemory() {
            const word = this.memoryWindow[this.memoryReviewKey];
            this.memoryReviewKey++;
            return word;
        },
        aRevoirMQ(word: WordItem) {
            const newWord = reactive({ ...word }) as WordItem;
            this.reviewQueue.push(newWord);
            this.memoryReviewKey--;
            this.memoryWindow = this.memoryWindow.filter(w => !(w.word === word.word && w.explanation === word.explanation));
            this.maxMemoryWindowLength = Math.max(5, this.maxMemoryWindowLength - 1);

            if (this.memoryWindowProgressTempWordList[word.word]) {
                this.memoryWindowProgressTempWordList[word.word] = this.memoryWindowProgressTempWordList[word.word].filter(w => w.explanation !== word.explanation);
                if (this.memoryWindowProgressTempWordList[word.word].length === 0) {
                    delete this.memoryWindowProgressTempWordList[word.word];
                }
            }
        },
        async updateRestMemory(){
            const authStore = useAuthStore();
            if (!authStore.user?.id) {
                console.error('User ID is required to update memory words');
                return;
            }

            const updateTasks: Array<Promise<void>> = [];

            if (this.memoryWindow.length > 0) {
                updateTasks.push(...this.memoryWindow.map(word => this.updateWordStatus(word)));
            }

            if (!!this.activeWordsProgressTempWordListWhenLearn) {
                for (const key in this.activeWordsProgressTempWordListWhenLearn) {
                    const wordList = this.activeWordsProgressTempWordListWhenLearn[key];
                    if (wordList && wordList.length > 0) {
                        updateTasks.push(...wordList.map(word => this.updateWordStatus(word)));
                    }
                }
            }

            await Promise.all(updateTasks);
        },
        findRelatedWordsById(id: number) {
            const motherWord = this.words.find(w => w.id === id);
            if (!motherWord) return [] as WordList;

            return this.words.filter(w =>
                w.word === motherWord.word &&
                w.type === motherWord.type &&
                w.notebook_id === motherWord.notebook_id
            );
        },
        findWords(word: string, type: 'active' | 'passive') {
            const normalizedWord = this.normalizeInputText(word).toLowerCase();
            return this.words.filter(w => this.normalizeInputText(w.word).toLowerCase() === normalizedWord && w.type === type);
        },
        findWord(word: string, type: 'active' | 'passive') {
            return this.findWords(word, type)[0];
        }
    }
});