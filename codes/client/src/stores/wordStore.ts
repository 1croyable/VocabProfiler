import { defineStore } from 'pinia';
import { reactive, toRaw } from 'vue';
import { axiosWrapper } from '../utilities/axios-wrapper';
import { WordList, WordPayload, WordItem } from '../type';
import dayjs from 'dayjs';

export const useWordStore = defineStore('word', {
    state: () => ({
        words: [] as WordList,
        activeWordsStruct: {},
        passiveWordsStruct: {},
        reviewQueue: [] as WordList,
        memoryWindow: [] as WordList,
        memoryReviewKey: 0,
        activeWordsReversedWordFlagWhenLearn: {} as Record<string, number>,
        activeWordsProgressTempWordListWhenLearn: {} as Record<string, Array<WordItem>>,
        activeWordsReversedWordFlagWhenReview: {} as Record<string, number>,
        activeWordsProgressTempWordList: {} as Record<string, Array<WordItem>>,
        reviewWordCount: 0, // 用来记录复习队列中已经复习过的单词数量，进而区分第一次复习还是循环复习
        reviewWordLimitPosition: 0,
        memoryWindowLength: 5,
        memoryWindowProgressTempWordList: {} as Record<string, Array<WordItem>>,
    }),
    actions: {
        async fetchWords(group: number = 1) {
            this.words = await axiosWrapper.get<WordList>(`/word/list?group=${group}`);
            // needBtn是前端控制的属性，默认全部为true
            this.words = this.words.map(word => ({ ...word, __needBtn__: true }));
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
                __needBtn__: true
            })

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
            const candidates = mode === 'new' ? (struct.wordsToLearn || []) : (struct.wordsToReview || []);
            if (type === 'active') {
                const reverseCandidates = candidates.map((word: WordItem) => {
                    const raw = toRaw(word);
                    const tempWord = reactive({ ...raw }) as WordItem;
                    const temp = tempWord.word;
                    tempWord.word = raw.explanation;
                    tempWord.explanation = temp;
                    return tempWord;
                });
                // 合并所有的，word有多个，解释只有一个，的倒转词汇，这个时候reverseCandidates里有多个项，explanation相同，需要合并word
                let reverseCandidatesReduced = [] as WordList;
                reverseCandidates.forEach((word: WordItem) => {
                    const existing = reverseCandidatesReduced.find(w => w.explanation === word.explanation);
                    if (existing) {
                        existing.word += ` / ${word.word}`;
                    } else {
                        reverseCandidatesReduced.push(word);
                    }
                })
                // 补上仓库中有的但是现在不用复习的，因此没有算计你去的那些解释到word里
                this.words.forEach(word => {
                    if (word.type === 'active') {
                        const existing = reverseCandidatesReduced.find(w => w.explanation === word.word);
                        if (existing && !existing.word.split(' / ').includes(word.explanation)) {
                            existing.word += ` / ${word.explanation}`;
                        }
                    }
                })
                console.log([...candidates, ...reverseCandidatesReduced])
                return [...candidates, ...reverseCandidatesReduced];
            } else return candidates
        },
        // 初始化背诵队列：筛选 + 随机打乱 + 游标归零
        initReviewQueue(type: 'active' | 'passive', mode: 'new' | 'review') {
            // 确保分组结构是最新的
            this.rangeWords();
            const candidates = this.getCandidates(type, mode);
            this.reviewQueue = this.shuffle(candidates);
            this.activeWordsReversedWordFlagWhenLearn = {};
            this.activeWordsReversedWordFlagWhenReview = {};
            this.activeWordsProgressTempWordList = {};
            this.memoryWindowProgressTempWordList = {};
            this.reviewWordCount = 0;
            this.reviewWordLimitPosition = 0;
            return this.reviewQueue.length;
        },
        // 查看当前队列头（不出队）
        peekCurrent() {
            console.log("Peeking current word, queue:", this.reviewQueue);
            if (!this.reviewQueue.length) return null;
            return this.reviewQueue[0] ?? null;
        },
        // 重置队列
        resetQueue() {
            this.reviewQueue = [];
            this.memoryWindow = [];
            this.activeWordsReversedWordFlagWhenLearn = {};
            this.activeWordsReversedWordFlagWhenReview = {};
            this.activeWordsProgressTempWordList = {};
            this.memoryWindowProgressTempWordList = {};
            this.reviewWordCount = 0;
            this.reviewWordLimitPosition = 0;
        },
        cleanupReviewTemp() {
            // 复习阶段只清理临时状态，不做额外的等级更新
            this.activeWordsReversedWordFlagWhenReview = {};
            this.activeWordsProgressTempWordList = {};
            this.memoryWindowProgressTempWordList = {};
        },
        async updateWordStatus(word: WordItem, toLevel: number | null = null) {
            console.log("触发词汇状态更新", word, "目标等级：", toLevel);
            if (word.__isReversed__) return;
            const id = word.id;
            const wordData = word.word;
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

            console.log("尝试更新单词状态，id:", id, "word: ", wordData, "新等级:", newLevel, "下次复习日期:", nextReviewDate);

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
            console.log('词汇被加入记忆创库哦，即将从复习队列中删除的单词：', word);
            this.reviewQueue = this.reviewQueue.filter(w => w.word !== word.word || w.explanation !== word.explanation);
        },
        aRevoirRQ(word: WordItem){
            const newWord = reactive({ ...word }) as WordItem;
            this.dropFromReviewQueue(word);
            this.reviewQueue.push(newWord);
            console.log("在删掉了原有的单词并添加了这个一样的单词到复习队列末尾之后，当前复习队列：", this.reviewQueue);
        },
        // 记忆窗口控制相关的函数
        async enqueueToWindow(word: WordItem, isNew: Boolean, complex: Boolean = false){
            console.log(isNew ? "学习新词中" : "复习中");
            // 只有通过了词汇队列被踢掉的词汇才认为是记住了，在学习新词的背景下需要修改数据库
            let head = null;
            // 如果是一个word对应多个explanation，那么可以一起存入记忆窗口，动态增加memoryWindowLength
            if (complex && this.memoryWindowLength >= 5) {
                // 如果是新的词汇在记忆窗口中已经有了，那么this.memoryWindowLength++; 否则新进来一个就可以顶到前面的词汇保持原大小
                const existingIndex = this.memoryWindow.findIndex(w => w.word === word.word);
                if (existingIndex !== -1) {
                    this.memoryWindowLength++;
                }
            }
            console.log("一个词汇输入记忆窗口是否是结合词汇", complex, "当前memory窗口长度", this.memoryWindow.length, "当前memory窗口最大长度", this.memoryWindowLength);
            if (this.memoryWindow.length === this.memoryWindowLength) {
                head = this.memoryWindow.shift();
                console.log("memory窗口已满，弹出队头的词汇：", head);
            }
            const newWord = reactive({ ...word }) as WordItem;
            this.memoryWindow.push(newWord);

            if (head && isNew) {
                console.log("新的词汇学习中，有词汇被顶出记忆窗口")
                if (head.__isReversed__) {
                    this.activeWordsReversedWordFlagWhenLearn[head.explanation] = 1;
                    if (this.activeWordsProgressTempWordListWhenLearn[head.explanation]) {
                        console.log("之前有记住过这个倒转意义的正向词汇，更新它们的状态，列表：", this.activeWordsProgressTempWordListWhenLearn[head.explanation]);
                        this.activeWordsProgressTempWordListWhenLearn[head.explanation].forEach(async w => {
                            await this.updateWordStatus(w);
                        });
                    }
                } else {
                    // 如果不是倒转词，那么判断，如果是active词汇，那么要做必要措施
                    if (head.type === 'active') {
                        if (this.activeWordsReversedWordFlagWhenLearn[head.word] !== 1) {
                            // 临时存入一个列表
                            if (!this.activeWordsProgressTempWordListWhenLearn[head.word]) this.activeWordsProgressTempWordListWhenLearn[head.word] = [];
                            this.activeWordsProgressTempWordListWhenLearn[head.word].push(head);
                            console.log("之前没有记住过这个词汇的倒转意义，先把这个正向词汇存入临时列表，等待复习过程中如果出现了这个词汇的倒转意义被记住了，再更新它的状态，当前临时列表：", this.activeWordsProgressTempWordListWhenLearn);
                        } else {
                            // 已经是1了
                            console.log("之前已经记住过这个词汇的倒转意义了，更新这个正向词汇的状态，", head);
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
            console.log("查看memory窗口是否看完：", result, " (当前的进度是", this.memoryReviewKey, "/ 一共的长度", this.memoryWindow.length, ")");
            if (result) {
                this.memoryReviewKey = 0; // 在比较的时候就做好重置，让指针回到队头
                this.memoryWindowProgressTempWordList = {}; // 每轮复习结束，重置临时列表
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
            this.memoryWindowLength = Math.max(5, this.memoryWindowLength - 1);

            console.log("从临时memoryWindowProgressTempWordList队列里移除");
            if (this.memoryWindowProgressTempWordList[word.word]) {
                this.memoryWindowProgressTempWordList[word.word] = this.memoryWindowProgressTempWordList[word.word].filter(w => w.explanation !== word.explanation);
                if (this.memoryWindowProgressTempWordList[word.word].length === 0) {
                    delete this.memoryWindowProgressTempWordList[word.word];
                }
                console.log("当前临时列表：", this.memoryWindowProgressTempWordList);
            }
        },
        async updateRestMemory(){
            if (this.memoryWindow.length > 0) {
                this.memoryWindow.forEach(async word => {
                    await this.updateWordStatus(word);
                })
            }
            if (!!this.activeWordsProgressTempWordListWhenLearn) {
                for (const key in this.activeWordsProgressTempWordListWhenLearn) {
                    const wordList = this.activeWordsProgressTempWordListWhenLearn[key];
                    if (wordList && wordList.length > 0) {
                        for (const word of wordList) {
                            await this.updateWordStatus(word);
                        }
                    }
                }
            }
        },
        findWord(word: string, type: 'active' | 'passive') {
            return this.words.find(w => w.word === word && w.type === type);
        }
    }
});