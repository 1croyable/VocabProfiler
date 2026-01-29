export type WordType = 'passive' | 'active';

export interface WordItem {
    id: number;
	word: string;
	explanation: string;
	type: WordType;
	level: number;
	next_review_date: string | null;
	created_at: string;
	word_group: number;
}

export interface WordPayload {
    word: string;
    explanation: string;
    type: WordType;
    word_group: number;
}

export type WordList = WordItem[];
