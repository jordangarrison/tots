<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import CharacterPicker from '$lib/characters/CharacterPicker.svelte';
	import type { CharacterId } from '$lib/characters';
	import KingdomGame from '$lib/kingdom/components/KingdomGame.svelte';
	import { loadSave, newSave } from '$lib/kingdom/save';
	import type { SaveState } from '$lib/kingdom/types';

	export const prerender = true;

	let state: SaveState | null = null;
	let booted = false;

	onMount(() => {
		state = loadSave();
		booted = true;
	});

	function pickCharacter(id: CharacterId) {
		state = newSave(id);
	}

	function backToArcade() {
		void goto('/');
	}
</script>

<svelte:head>
	<title>Kingdom — TOTS Arcade</title>
</svelte:head>

{#if !booted}
	<div class="loading">LOADING…</div>
{:else if state === null}
	<CharacterPicker
		prompt="WELCOME TO THE KINGDOM — WHO ARE YOU TODAY?"
		onPick={pickCharacter}
		onBack={backToArcade}
	/>
{:else}
	<KingdomGame initialState={state} onExit={backToArcade} />
{/if}

<style>
	.loading {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		color: var(--rp-subtle);
		letter-spacing: 0.2em;
	}
</style>
