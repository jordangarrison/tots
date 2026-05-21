<script lang="ts">
	import { goto } from '$app/navigation';
	import CharacterPicker from '$lib/characters/CharacterPicker.svelte';
	import type { CharacterId } from '$lib/characters';
	import DigDugGame from '$lib/digdug/components/DigDugGame.svelte';

	export const prerender = true;

	let characterId: CharacterId | null = null;

	function pickCharacter(id: CharacterId) {
		characterId = id;
	}

	function backToArcade() {
		void goto('/');
	}

	function exitToPicker() {
		characterId = null;
	}
</script>

<svelte:head>
	<title>Dig Dug — TOTS Arcade</title>
</svelte:head>

{#if characterId === null}
	<CharacterPicker
		prompt="WHO'S DIGGING TODAY?"
		onPick={pickCharacter}
		onBack={backToArcade}
	/>
{:else}
	<DigDugGame {characterId} onExit={exitToPicker} />
{/if}
