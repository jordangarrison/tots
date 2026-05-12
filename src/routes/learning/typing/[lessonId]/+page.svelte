<script lang="ts">
	import { goto } from '$app/navigation';
	import TypingLesson from '$lib/typing/TypingLesson.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: lesson = data.lesson;

	function backToPicker() {
		void goto('/learning/typing');
	}
</script>

<svelte:head>
	<title>{lesson.title} — Typing Teacher — TOTS Arcade</title>
</svelte:head>

{#key lesson.id}
	<TypingLesson {lesson} on:exit={backToPicker} />
{/key}
