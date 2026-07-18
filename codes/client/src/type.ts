export type WordType = 'passive' | 'active';

export interface WordItem {
    id: number;
	word: string;
	explanation: string;
	type: WordType;
	level: number;
	next_review_date: string | null;
	created_at: string;
	notebook_id: number;
	__needBtn__: boolean; // 考虑到合并词汇，需要区分是否需要显示操作按钮
	__isReversed__?: boolean;
}

export interface WordPayload {
    word: string;
    explanation: string;
    type: WordType;
    notebook_id: number;
}

export type WordList = WordItem[];
