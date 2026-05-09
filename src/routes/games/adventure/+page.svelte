<script lang="ts">
	import { goto } from '$app/navigation';
	import { characters } from '$lib/adventure/characters';
	import type { CharacterId } from '$lib/adventure/types';
	import { stories, getStory } from '$lib/adventure/stories';
	import StoryPicker from '$lib/adventure/components/StoryPicker.svelte';
	import CharacterPicker from '$lib/adventure/components/CharacterPicker.svelte';
	import StoryPlayer from '$lib/adventure/components/StoryPlayer.svelte';

	export const prerender = true;

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
	<CharacterPicker onPick={pickCharacter} onBack={backToStories} />
{:else if chosenStory}
	<StoryPlayer
		story={chosenStory}
		character={characters[characterId]}
		onExit={exitToStories}
	/>
{/if}
