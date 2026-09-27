import { defineStore } from 'pinia';
import { axiosWrapper } from '../utilities/axios-wrapper';
import type { WordType } from '../type';

export interface Note {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
    word_count: number;
    active_count: number;
    passive_count: number;
}

export interface NoteWord {
    id: number;
    note_id: number;
    word: string;
    explanation: string;
    type: WordType;
    created_at: string;
}

type NoteWordInput = Pick<NoteWord, 'word' | 'explanation' | 'type'>;

export const useNoteStore = defineStore('notes', {
    state: () => ({
        notes: [] as Note[],
        currentNote: null as Note | null,
        words: [] as NoteWord[],
    }),
    actions: {
        async fetchNotes() {
            this.notes = await axiosWrapper.get<Note[]>('/notes');
            if (this.currentNote) {
                this.currentNote = this.notes.find(note => note.id === this.currentNote?.id) ?? null;
                if (!this.currentNote) this.words = [];
            }
        },
        async selectNote(note: Note) {
            const words = await axiosWrapper.get<NoteWord[]>(`/notes/${note.id}/words`);
            this.currentNote = this.notes.find(item => item.id === note.id) ?? note;
            this.words = words;
        },
        async createNote() {
            const note = await axiosWrapper.post<Note>('/notes');
            this.notes.push(note);
            return note;
        },
        async renameNote(note: Note, name: string) {
            await axiosWrapper.patch(`/notes/${note.id}`, { name });
            note.name = name;
        },
        async deleteNote(note: Note) {
            await axiosWrapper.delete(`/notes/${note.id}`);
            this.notes = this.notes.filter(item => item.id !== note.id);
            if (this.currentNote?.id === note.id) {
                this.currentNote = null;
                this.words = [];
            }
        },
        async addWord(input: NoteWordInput) {
            if (!this.currentNote) throw new Error('Choose a note before adding words');
            const { id } = await axiosWrapper.post<{ id: number }>(`/notes/${this.currentNote.id}/words`, input);
            this.words.push({ id, note_id: this.currentNote.id, ...input, created_at: new Date().toLocaleString('sv-SE') });
            this.updateCounts();
        },
        async updateWord(id: number, input: NoteWordInput) {
            if (!this.currentNote) return;
            await axiosWrapper.patch(`/notes/${this.currentNote.id}/words/${id}`, input);
            const index = this.words.findIndex(word => word.id === id);
            if (index !== -1) this.words[index] = { ...this.words[index], ...input };
            this.updateCounts();
        },
        async deleteWord(id: number) {
            if (!this.currentNote) return;
            await axiosWrapper.delete(`/notes/${this.currentNote.id}/words/${id}`);
            this.words = this.words.filter(word => word.id !== id);
            this.updateCounts();
        },
        async applyToNotebook(note: Note, notebookId: number) {
            return axiosWrapper.post<{ added: number }>(`/notes/${note.id}/apply`, { notebook_id: notebookId });
        },
        updateCounts() {
            if (!this.currentNote) return;
            this.currentNote.word_count = this.words.length;
            this.currentNote.active_count = this.words.filter(word => word.type === 'active').length;
            this.currentNote.passive_count = this.words.filter(word => word.type === 'passive').length;
        },
    },
});
