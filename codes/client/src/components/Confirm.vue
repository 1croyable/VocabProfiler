<template>
	<v-dialog v-model="dialog" max-width="500">
		<v-card class="confirm-card">
			<v-card-title class="text-h6 font-weight-bold confirm-title">
				{{ title }}
			</v-card-title>

			<v-card-text class="confirm-text">
				{{ message }}
			</v-card-text>

			<v-card-actions class="confirm-actions">
				<v-spacer />
				<v-btn variant="text" @click="onCancel">
					{{ cancelText }}
				</v-btn>
				<v-btn color="primary" variant="flat" @click="onConfirm">
					{{ confirmText }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	title: {
		type: String,
		default: 'Are you sure?',
	},
	message: {
		type: String,
		default: 'Are you sure you want to continue?',
	},
	confirmText: {
		type: String,
		default: 'Confirm',
	},
	cancelText: {
		type: String,
		default: 'Cancel',
	},
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const dialog = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value),
});

function onConfirm() {
	emit('confirm');
	emit('update:modelValue', false);
}

function onCancel() {
	emit('cancel');
	emit('update:modelValue', false);
}
</script>

<style lang="less" scoped>
.confirm-card {
	padding: 8px 4px 4px;
}

.confirm-title {
	padding-bottom: 0;
}

.confirm-text {
	padding-top: 8px;
	color: rgba(0, 0, 0, 0.7);
}

.confirm-actions {
	padding: 0 16px 16px;
}
</style>