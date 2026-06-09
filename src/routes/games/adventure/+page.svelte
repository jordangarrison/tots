<script lang="ts">
	import { goto } from '$app/navigation';
	import { characters } from '$lib/characters';
	import type { CharacterId } from '$lib/characters';
	import { stories, getStory } from '$lib/adventure/stories';
	import StoryPicker from '$lib/adventure/components/StoryPicker.svelte';
	import CharacterPicker from '$lib/characters/CharacterPicker.svelte';
	import StoryPlayer from '$lib/adventure/components/StoryPlayer.svelte';
	import { onMount } from 'svelte';
	import { recordPlay } from '$lib/arcade/scores';

	export const prerender = true;

	onMount(() => recordPlay('adventure'));

	let storyId: string | null = null;
	let characterId: CharacterId | null = null;

	$: chosenStory = storyId ? getStory(storyId) : null;

	function pickStory(id: string) {
		storyId = id;
	}

	function pickCharacter(id: CharacterId) {
		characterId = id;
	}

	function backToStories() {
		storyId = null;
		characterId = null;
	}

	function backToArcade() {
		void goto('/');
	}

	function exitToStories() {
		storyId = null;
		characterId = null;
	}
</script>

<svelte:head>
	<title>Adventure — TOTS Arcade</title>
</svelte:head>

{#if storyId === null}
	<StoryPicker {stories} onPick={pickStory} onBack={backToArcade} />
{:else if characterId === null}
	<CharacterPicker
		prompt="WHO'S COMING ON THE ADVENTURE?"
		onPick={pickCharacter}
		onBack={backToStories}
	/>
{:else if chosenStory}
	<StoryPlayer
		story={chosenStory}
		character={characters[characterId]}
		onExit={exitToStories}
		onHome={backToArcade}
	/>
{/if}
