<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div class="_gaps">
			<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel" style="padding: 16px;">
				<div>{{ relay.inbox }}</div>
				<div style="margin: 8px 0;">
					<i v-if="relay.status === 'accepted'" class="ph-check ph-bold ph-lg" :class="$style.icon" style="color: var(--success);"></i>
					<i v-else-if="relay.status === 'rejected'" class="ph-prohibit ph-bold ph-lg" :class="$style.icon" style="color: var(--error);"></i>
					<i v-else class="ph-clock ph-bold ph-lg" :class="$style.icon"></i>
					<span>{{ i18n.ts._relayStatus[relay.status] }}</span>
				</div>
				<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="ph-trash ph-bold ph-lg"></i> {{ i18n.ts.remove }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const relays = ref<Misskey.entities.AdminRelaysListResponse>([]);

async function addRelay() {
	const { canceled, result: inbox } = await os.inputText({
		title: i18n.ts.addRelay,
		type: 'url',
		placeholder: i18n.ts.inboxUrl,
	});
	if (canceled) return;
	misskeyApi('admin/relays/add', {
		inbox,
	}).then((relay: any) => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function remove(inbox: string) {
	misskeyApi('admin/relays/remove', {
		inbox,
	}).then(() => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function refresh() {
	misskeyApi('admin/relays/list').then(relayList => {
		relays.value = relayList;
	});
}

refresh();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ph-plus ph-bold ph-lg',
	text: i18n.ts.addRelay,
	handler: addRelay,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.relays,
	icon: 'ph-planet ph-bold ph-lg',
}));
</script>

<style lang="scss" module>
.icon {
	width: 1em;
	margin-right: 0.75em;
}
</style>
