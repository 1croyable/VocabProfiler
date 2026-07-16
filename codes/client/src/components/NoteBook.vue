<template>
	<v-card class="bg-transparent elevation-0" elevation="4" width="100%">
		<v-card-title class="text-h6 font-weight-bold">
			Word Notebook
		</v-card-title>

		<v-card-text>
			<v-text-field
				v-model="search"
				density="compact"
				label="Search by word"
				prepend-inner-icon="mdi-magnify"
				variant="outlined"
				flat
				hide-details
				single-line
				class="mb-4"
			/>
			<v-data-table
                class="bg-transparent table"
				v-model:search="search"
				:filter-keys="['word']"
				:headers="headers"
				:items="tableItems"
				density="comfortable"
				hover
                :cell-props="() => ({ class: 'notebook-cell' })"
				@click:row="openEditDialog"
			>
				<template v-slot:item.index="{ item }">
					<div class="cell-clamp cell-center">{{ item.index }}</div>
				</template>

				<template v-slot:item.word="{ item }">
					<div class="multiline-cell">{{ item.word }}</div>
				</template>

				<template v-slot:item.explanation="{ item }">
					<div class="multiline-cell">{{ item.explanation }}</div>
				</template>

				<template v-slot:item.type="{ item }">
					<div class="cell-clamp cell-center">{{ item.type }}</div>
				</template>

				<template v-slot:item.createdAt="{ item }">
					<div class="cell-clamp cell-center">{{ item.createdAt }}</div>
				</template>
			</v-data-table>
		</v-card-text>
	</v-card>

	<v-dialog v-model="showEditDialog" persistent max-width="480">
		<v-card class="edit-dialog-card" :loading="loading">
			<v-card-title class="text-h6 font-weight-bold">
				Modify record
			</v-card-title>

			<v-card-text>
				<v-container class="pa-0">
					<v-row>
						<v-col cols="12">
							<v-textarea
                                :loading="loading"
								v-model="editForm.word"
								label="Word"
								variant="outlined"
								auto-grow
								rows="2"
								hide-details
							/>
						</v-col>
					</v-row>

					<v-row>
						<v-col cols="12">
							<v-textarea
                                :loading="loading"
								v-model="editForm.explanation"
								label="Explanation"
								variant="outlined"
								auto-grow
								rows="4"
								hide-details
							/>
						</v-col>
					</v-row>

					<v-row>
						<v-col cols="12">
							<v-radio-group v-model="editForm.type" inline hide-details :disabled="loading">
								<v-radio label="active" value="active"/>
								<v-radio label="passive" value="passive"/>
							</v-radio-group>
						</v-col>
					</v-row>
				</v-container>
			</v-card-text>

			<v-card-actions>
				<v-spacer />
				<v-btn :disabled="loading" v-show="showSaveButton" variant="text" @click="saveEdit">Save</v-btn>
				<v-btn variant="text" :disabled="loading" @click="closeEditDialog">Cancel</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useWordStore } from '@/stores';
import { axiosWrapper } from '@/utilities/axios-wrapper';

const wordStore = useWordStore();
const search = ref('');
const showEditDialog = ref(false);
const selectedItem = ref(null);
const editForm = ref({
	word: '',
	explanation: '',
	type: 'active',
});
const loading = ref(false);

const headers = [
    { title: 'Number', key: 'index', sortable: false, width: 20 },
	{ title: 'Word', key: 'word', sortable: false, width: 120 },
	{ title: 'Explanation', key: 'explanation', sortable: false, width: 120 },
	{ title: 'Type', key: 'type', sortable: false, width: 70 },
    { title: 'Created At', key: 'createdAt', sortable: true, width: 130 },
];

const tableItems = computed(() => {
	return wordStore.words.map((word, index) => ({
		id: word.id,
		index: index + 1,
		word: word.word,
		explanation: word.explanation,
		type: word.type,
        createdAt: word.created_at.split(' ')[0],
        level: word.level
	}));
});

const showSaveButton = computed(() => {
    return selectedItem.value != null && (editForm.value.word !== selectedItem.value?.word ||
        editForm.value.explanation !== selectedItem.value?.explanation ||
        editForm.value.type !== selectedItem.value?.type);
});

function openEditDialog(event, data) {
	selectedItem.value = data?.item?.raw ?? data?.item ?? null;
	editForm.value = {
		word: selectedItem.value?.word,
		explanation: selectedItem.value?.explanation,
		type: selectedItem.value?.type
	};
	showEditDialog.value = true;
}

function closeEditDialog() {
	showEditDialog.value = false;
	selectedItem.value = null;
	editForm.value = {
		word: '',
		explanation: '',
		type: 'active',
	};
}

async function saveEdit(){
    try {
		loading.value = true;
		if (!selectedItem.value) return;

		const payload = {
			id: selectedItem.value.id,
			word: editForm.value.word,
			explanation: editForm.value.explanation,
			type: editForm.value.type,
		};

		await axiosWrapper.patch('/word/update', payload);

		const targetIndex = wordStore.words.findIndex(word => word.id === selectedItem.value.id);
		if (targetIndex !== -1) {
			wordStore.words[targetIndex] = {
				...wordStore.words[targetIndex],
				word: editForm.value.word,
				explanation: editForm.value.explanation,
				type: editForm.value.type,
			};
			wordStore.rangeWords();
		}

		closeEditDialog();
    } catch (error) {
        console.error('Failed to update word:', error);
    } finally {
        loading.value = false;
    }
}
</script>

<style lang="less" scoped>
.multiline-cell {
	white-space: pre-line;
	line-height: 1.4;
	height: 2.8em;
	overflow: hidden;
	display: flex;
    flex-direction: column;
	word-break: normal;
	overflow-wrap: anywhere;
}

.cell-center {
	-webkit-box-pack: center;
	justify-content: center;
	text-align: center;
}

:deep(.notebook-cell) {
	padding: 2px 10px !important;
}

.table {
	:deep(.v-table__wrapper > table) {
		table-layout: fixed;
		width: max-content;
	}

	:deep(.v-table__wrapper) {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	:deep(.v-table__wrapper::-webkit-scrollbar) {
		display: none;
	}
}

.edit-dialog-card {
	min-height: 180px;
}
</style>
