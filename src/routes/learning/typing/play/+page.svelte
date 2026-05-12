<script lang="ts">
	import { goto } from '$app/navigation';
	import FreePlay from '$lib/typing/FreePlay.svelte';

	export const prerender = true;

	function backToPicker() {
		void goto('/learning/typing');
	}
</script>

<svelte:head>
	<title>Tap Any Key — TOTS Arcade</title>
</svelte:head>

<FreePlay on:exit={backToPicker} />
