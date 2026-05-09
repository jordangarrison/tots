<script lang="ts">
	import { goto } from '$app/navigation';
	import { characters } from '$lib/adventure/characters';
	import type { CharacterId } from '$lib/adventure/types';
	import { lonelyLantern } from '$lib/adventure/stories/lonely-lantern';
	import CharacterPicker from '$lib/adventure/components/CharacterPicker.svelte';
	import StoryPlayer from '$lib/adventure/components/StoryPlayer.svelte';

	export const prerender = true;

	let chosen: CharacterId | null = null;

	function pick(id: CharacterId) {
		chosen = id;
	}

	function exitToPicker() {
		chosen = null;
	}

	function backToArcade() {
		void goto('/');
	}
</script>

<svelte:head>
	<title>Adventure — TOTS Arcade</title>
</svelte:head>

{#if chosen === null}
	<CharacterPicker onPick={pick} onBack={backToArcade} />
{:else}
	<StoryPlayer story={lonelyLantern} character={characters[chosen]} onExit={exitToPicker} />
{/if}
