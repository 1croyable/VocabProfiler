import { defineStore } from 'pinia';
import { axiosWrapper } from '../utilities/axios-wrapper';
import { WordList, WordPayload, WordItem } from '../type';
import dayjs from 'dayjs';

export const useWordStore = defineStore('word', {
    state: () => ({
        words: [] as WordList,
        activeWordsStruct: {},
        passiveWordsStruct: {},
        reviewQueue: [] as WordList,
    }),
    actions: {
        async fetchWords(group: number = 1) {
            this.words = await axiosWrapper.get<WordList>(`/word/list?group=${group}`);
            this.rangeWords();
        },
        async addWord(payload: WordPayload) {
            const newId = await axiosWrapper.post<number>('/word/add', payload);

            this.words.push({
                id: newId,
                ...payload,
                level: 0,
                next_review_date: null,
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            })

            console.log('After add word:', this.words);
            this.rangeWords();
        },
        rangeWords() {
            const activeWords = this.words.filter(word => word.type === 'active');
            const passiveWords = this.words.filter(word => word.type === 'passive');

            const activeWordsToReview = activeWords.filter(word => word.level > 0).filter(word => {
                // 下次复习日期为今天或之前的
                if (!word.next_review_date) return false;
                return dayjs(word.next_review_date).isBefore(dayjs().add(1, 'day'), 'day');
            });

            const passiveWordsToReview = passiveWords.filter(word => word.level > 0).filter(word => {
                // 下次复习日期为今天或之前的
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
        // Fisher-Yates 洗牌算法，随机打乱数组
        shuffle<T>(arr: T[]): T[] {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        // 根据类型与模式筛选候选词列表
        getCandidates(type: 'active' | 'passive', mode: 'new' | 'review'): WordList {
            const struct = type === 'active' ? (this.activeWordsStruct as any) : (this.passiveWordsStruct as any);
            if (!struct) return [];
            return mode === 'new' ? (struct.wordsToLearn || []) : (struct.wordsToReview || []);
        },
        // 初始化背诵队列：筛选 + 随机打乱 + 游标归零
        initReviewQueue(type: 'active' | 'passive', mode: 'new' | 'review') {
            // 确保分组结构是最新的
            this.rangeWords();
            const candidates = this.getCandidates(type, mode);
            this.reviewQueue = this.shuffle(candidates);
            return this.reviewQueue.length;
        },
        // 查看当前队列头（不出队）
        peekCurrent() {
            console.log("Peeking current word, queue:", this.reviewQueue);
            if (!this.reviewQueue.length) return null;
            return this.reviewQueue[0] ?? null;
        },
        // 将一个词重新加入队列末尾
        enqueueToEnd(word: WordItem) {
            this.reviewQueue.push(word);
        },
        // 重置队列
        resetQueue() {
            this.reviewQueue = [];
        },
        async updateWordStatus(word: WordItem, toLevel: number | null = null) {
            const id = word.id;
            const newLevel = toLevel !== null ? toLevel : word.level + 1;
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
                default:
                    nextReviewDate = null; // level6 不再复习
            }

            await axiosWrapper.patch('/word/update-level', {
                id,
                level: newLevel,
                next_review_date: nextReviewDate,
            });

            const idx = this.words.findIndex(w => w.id === id);
            if (idx !== -1) {
                this.words[idx] = { ...this.words[idx], level: newLevel, next_review_date: nextReviewDate };
                this.rangeWords();
            }
        },
        deleteHead() {
            // 用于在某个单词被标记为记住后剔除复习队列，这是真的剔除
            this.reviewQueue.shift();
        },
        aRevoir(word: WordItem){
            this.reviewQueue.push(word);
            this.reviewQueue.shift();
        },
    }
});