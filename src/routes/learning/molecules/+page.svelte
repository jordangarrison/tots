<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { ELEMENTS, ELEMENT_BY_SYMBOL } from '$lib/molecules/elements';
	import { MOLECULES } from '$lib/molecules/molecules';
	import { QUESTS } from '$lib/molecules/quests';
	import { combine, type ReactionResult } from '$lib/molecules/engine';
	import {
		loadProgress,
		recordDiscovery,
		recordQuest
	} from '$lib/molecules/save';
	import type { MoleculesSave } from '$lib/molecules/types';
	import { parseFormula } from '$lib/molecules/types';
	import MoleculeView from '$lib/molecules/MoleculeView.svelte';

	export const prerender = true;

	type Placed = { id: number; el: string; x: number; y: number };

	let placed: Placed[] = [];
	let nextId = 1;

	let workbenchEl: HTMLDivElement;
	let result: ReactionResult = { status: 'empty' };
	let reactTimer: ReturnType<typeof setTimeout> | null = null;
	const REACT_DELAY = 1500;

	function fadeScale(_node: Element, { duration = 350 } = {}) {
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => `opacity: ${t}; transform: scale(${0.85 + t * 0.15})`
		};
	}

	let save: MoleculesSave = { version: 1, discovered: {}, questsCompleted: {} };
	let toast: { kind: 'discovery' | 'quest'; text: string } | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	type Panel = 'workbench' | 'journal' | 'quests';
	let panel: Panel = 'workbench';

	// Drag state. One pointer at a time keeps things simple.
	let drag: {
		pointerId: number;
		el: string;
		sourceId: number | null; // id of an existing atom, or null when dragging from tray
		ghostX: number;
		ghostY: number;
	} | null = null;

	onMount(() => {
		save = loadProgress();
	});

	function scheduleReact() {
		if (reactTimer) clearTimeout(reactTimer);
		if (placed.length === 0) {
			result = { status: 'empty' };
			return;
		}
		reactTimer = setTimeout(() => tryReact(), REACT_DELAY);
	}

	function tryReact() {
		const symbols = placed.map((p) => p.el);
		const r = combine(symbols);
		result = r;
		if (r.status === 'matched') {
			const before = !!save.discovered[r.molecule.key];
			save = recordDiscovery(r.molecule.key);
			if (!before) {
				showToast('discovery', `Discovered ${r.molecule.name}!`);
			}
			// Check quests
			for (const q of QUESTS) {
				if (q.target === r.molecule.key && !save.questsCompleted[q.id]) {
					save = recordQuest(q.id);
					showToast('quest', `Quest complete: ${q.prompt}`);
				}
			}
		}
	}

	function showToast(kind: 'discovery' | 'quest', text: string) {
		toast = { kind, text };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 3200);
	}

	function clearWorkbench() {
		placed = [];
		result = { status: 'empty' };
		if (reactTimer) clearTimeout(reactTimer);
	}

	function manualReact() {
		if (reactTimer) clearTimeout(reactTimer);
		tryReact();
	}

	function workbenchLocal(clientX: number, clientY: number): { x: number; y: number } | null {
		if (!workbenchEl) return null;
		const r = workbenchEl.getBoundingClientRect();
		const x = clientX - r.left;
		const y = clientY - r.top;
		if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
		return { x, y };
	}

	function onTrayPointerDown(ev: PointerEvent, symbol: string) {
		ev.preventDefault();
		(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
		drag = {
			pointerId: ev.pointerId,
			el: symbol,
			sourceId: null,
			ghostX: ev.clientX,
			ghostY: ev.clientY
		};
	}

	function onAtomPointerDown(ev: PointerEvent, atom: Placed) {
		ev.preventDefault();
		(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
		drag = {
			pointerId: ev.pointerId,
			el: atom.el,
			sourceId: atom.id,
			ghostX: ev.clientX,
			ghostY: ev.clientY
		};
	}

	function onPointerMove(ev: PointerEvent) {
		if (!drag || drag.pointerId !== ev.pointerId) return;
		drag.ghostX = ev.clientX;
		drag.ghostY = ev.clientY;
		drag = drag; // trigger reactivity
	}

	function onPointerUp(ev: PointerEvent) {
		if (!drag || drag.pointerId !== ev.pointerId) return;
		const local = workbenchLocal(ev.clientX, ev.clientY);
		const wasFromTray = drag.sourceId === null;
		const sourceId = drag.sourceId;
		const symbol = drag.el;
		drag = null;

		if (local) {
			if (wasFromTray) {
				placed = [...placed, { id: nextId++, el: symbol, x: local.x, y: local.y }];
				scheduleReact();
			} else if (sourceId !== null) {
				// Move existing atom to new spot
				placed = placed.map((p) => (p.id === sourceId ? { ...p, x: local.x, y: local.y } : p));
				// Position changed but composition didn't; no need to re-react.
			}
		} else if (!wasFromTray && sourceId !== null) {
			// Dropped outside workbench → remove
			placed = placed.filter((p) => p.id !== sourceId);
			scheduleReact();
		}
	}

	function onPointerCancel(ev: PointerEvent) {
		if (drag && drag.pointerId === ev.pointerId) drag = null;
	}

	// Pick a scatter point in the workbench that isn't sitting on top of another atom.
	function scatter(): { x: number; y: number } | null {
		if (!workbenchEl) return null;
		const r = workbenchEl.getBoundingClientRect();
		const pad = 36;
		const minDist = 52;
		const usableW = Math.max(60, r.width - pad * 2);
		const usableH = Math.max(60, r.height - pad * 2);
		for (let i = 0; i < 30; i++) {
			const x = pad + Math.random() * usableW;
			const y = pad + Math.random() * usableH;
			const conflict = placed.some((p) => Math.hypot(p.x - x, p.y - y) < minDist);
			if (!conflict) return { x, y };
		}
		return {
			x: pad + Math.random() * usableW,
			y: pad + Math.random() * usableH
		};
	}

	function addOne(symbol: string) {
		const pos = scatter();
		if (!pos) return;
		placed = [...placed, { id: nextId++, el: symbol, x: pos.x, y: pos.y }];
		scheduleReact();
	}

	function removeOne(symbol: string) {
		for (let i = placed.length - 1; i >= 0; i--) {
			if (placed[i].el === symbol) {
				placed = [...placed.slice(0, i), ...placed.slice(i + 1)];
				scheduleReact();
				return;
			}
		}
	}

	// Long-press repeating handlers. Tap once for a single add; hold to keep adding.
	let pressHoldTimer: ReturnType<typeof setTimeout> | null = null;
	let pressRepeatTimer: ReturnType<typeof setInterval> | null = null;

	function startPress(action: () => void, ev: PointerEvent) {
		ev.stopPropagation();
		ev.preventDefault();
		(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
		action();
		pressHoldTimer = setTimeout(() => {
			pressRepeatTimer = setInterval(action, 110);
		}, 380);
	}

	function endPress() {
		if (pressHoldTimer) {
			clearTimeout(pressHoldTimer);
			pressHoldTimer = null;
		}
		if (pressRepeatTimer) {
			clearInterval(pressRepeatTimer);
			pressRepeatTimer = null;
		}
	}

	$: counts = (() => {
		const c = new Map<string, number>();
		for (const p of placed) c.set(p.el, (c.get(p.el) ?? 0) + 1);
		return [...c.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	})();

	$: countsBySymbol = (() => {
		const c: Record<string, number> = {};
		for (const p of placed) c[p.el] = (c[p.el] ?? 0) + 1;
		return c;
	})();

	$: matched = result.status === 'matched' ? result.molecule : null;

	$: discoveredCount = Object.keys(save.discovered).length;
	$: questsDoneCount = Object.keys(save.questsCompleted).length;
</script>

<svelte:head>
	<title>Molecules — TOTS Arcade</title>
</svelte:head>

<svelte:window
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerCancel}
/>

<div class="page">
	<header class="head">
		<a class="back-link" href="/" aria-label="Back to arcade">◄</a>
		<h2 class="prompt">
			<span class="prompt-bracket">►</span>
			MOLECULES
			<span class="prompt-cursor">_</span>
		</h2>
		<div class="head-actions">
			<button
				type="button"
				class="tab-btn"
				class:active={panel === 'quests'}
				on:click={() => (panel = panel === 'quests' ? 'workbench' : 'quests')}
			>
				QUESTS <span class="count">{questsDoneCount}/{QUESTS.length}</span>
			</button>
			<button
				type="button"
				class="tab-btn"
				class:active={panel === 'journal'}
				on:click={() => (panel = panel === 'journal' ? 'workbench' : 'journal')}
			>
				JOURNAL <span class="count">{discoveredCount}/{MOLECULES.length}</span>
			</button>
		</div>
	</header>

	<div class="stage" class:overlayed={panel !== 'workbench'}>
		<div
			class="workbench"
			class:matched
			bind:this={workbenchEl}
			aria-label="Mixing area"
		>
			{#if placed.length === 0 && !matched}
				<div class="placeholder">
					<div class="placeholder-emoji">🧪</div>
					<div class="placeholder-text">Drag atoms here to mix them up!</div>
				</div>
			{/if}

			{#if matched}
				<div class="molecule-stage" in:fadeScale>
					<MoleculeView molecule={matched} />
				</div>
				<div class="match-card">
					<div class="match-name">{matched.name}</div>
					<div class="match-formula">
						{#each parseFormula(matched.formula) as part (part.el + (part.n ?? ''))}<span class="el-letters">{part.el}</span>{#if part.n}<sub>{part.n}</sub>{/if}{/each}
					</div>
					<div class="match-fact">{matched.fact}</div>
				</div>
			{:else}
				{#each placed as p (p.id)}
					{@const el = ELEMENT_BY_SYMBOL[p.el]}
					<button
						type="button"
						class="placed"
						style="left: {p.x}px; top: {p.y}px; --fill: {el?.fill}; --text: {el?.text}"
						on:pointerdown={(ev) => onAtomPointerDown(ev, p)}
						aria-label="{el?.name} atom — drag off workbench to remove"
					>
						<span class="placed-label">{p.el}</span>
					</button>
				{/each}
			{/if}

			{#if result.status === 'unknown' && !matched}
				<div class="unknown-hint">
					Hmm, these atoms don't make a molecule we know yet. Try different counts!
				</div>
			{/if}
		</div>

		<aside class="counts" aria-label="Atom counts">
			{#if counts.length === 0}
				<span class="counts-empty">— no atoms yet —</span>
			{:else}
				{#each counts as [sym, n] (sym)}
					{@const el = ELEMENT_BY_SYMBOL[sym]}
					<span class="count-pill" style="--fill: {el?.fill}; --text: {el?.text}">
						<span class="count-sym">{sym}</span>
						<span class="count-n">×{n}</span>
					</span>
				{/each}
			{/if}
		</aside>

		<div class="controls">
			<button type="button" class="ctrl-btn react" on:click={manualReact} disabled={placed.length === 0}>
				⚡ REACT!
			</button>
			<button type="button" class="ctrl-btn clear" on:click={clearWorkbench} disabled={placed.length === 0}>
				✕ CLEAR
			</button>
		</div>

		<ul class="tray" aria-label="Element tray">
			{#each ELEMENTS as el (el.symbol)}
				<li>
					<div class="tile" style="--fill: {el.fill}; --text: {el.text}">
						<div
							class="tile-body"
							on:pointerdown={(ev) => onTrayPointerDown(ev, el.symbol)}
							role="button"
							tabindex="0"
							aria-label="Drag a {el.name} atom"
						>
							<span class="tile-symbol">{el.symbol}</span>
							<span class="tile-name">{el.name}</span>
						</div>
						<div class="tile-counter" aria-label="{el.name} count">
							<button
								type="button"
								class="tile-step"
								on:pointerdown={(ev) => startPress(() => removeOne(el.symbol), ev)}
								on:pointerup={endPress}
								on:pointerleave={endPress}
								on:pointercancel={endPress}
								disabled={(countsBySymbol[el.symbol] ?? 0) === 0}
								aria-label="Remove one {el.name}"
							>
								−
							</button>
							<span class="tile-count">{countsBySymbol[el.symbol] ?? 0}</span>
							<button
								type="button"
								class="tile-step"
								on:pointerdown={(ev) => startPress(() => addOne(el.symbol), ev)}
								on:pointerup={endPress}
								on:pointerleave={endPress}
								on:pointercancel={endPress}
								aria-label="Add one {el.name}"
							>
								+
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		{#if panel === 'journal'}
			<div class="overlay" role="dialog" aria-label="Discovery journal">
				<div class="overlay-head">
					<h3>JOURNAL</h3>
					<button type="button" class="overlay-close" on:click={() => (panel = 'workbench')}>
						✕
					</button>
				</div>
				<div class="journal-grid">
					{#each MOLECULES as m (m.key)}
						{@const found = !!save.discovered[m.key]}
						<div class="journal-card" class:found>
							{#if found}
								<div class="journal-thumb"><MoleculeView molecule={m} animate={false} /></div>
								<div class="journal-name">{m.name}</div>
								<div class="journal-formula">
									{#each parseFormula(m.formula) as part (part.el + (part.n ?? ''))}<span>{part.el}</span>{#if part.n}<sub>{part.n}</sub>{/if}{/each}
								</div>
								<div class="journal-fact">{m.fact}</div>
							{:else}
								<div class="journal-thumb locked">?</div>
								<div class="journal-name locked">???</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if panel === 'quests'}
			<div class="overlay" role="dialog" aria-label="Quests">
				<div class="overlay-head">
					<h3>QUESTS</h3>
					<button type="button" class="overlay-close" on:click={() => (panel = 'workbench')}>
						✕
					</button>
				</div>
				<ul class="quests-list">
					{#each QUESTS as q (q.id)}
						{@const done = !!save.questsCompleted[q.id]}
						<li class="quest" class:done>
							<span class="quest-check">{done ? '★' : '☆'}</span>
							<span class="quest-body">
								<span class="quest-prompt">{q.prompt}</span>
								<span class="quest-hint">{q.hint}</span>
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	{#if drag}
		{@const el = ELEMENT_BY_SYMBOL[drag.el]}
		<div
			class="ghost"
			style="left: {drag.ghostX}px; top: {drag.ghostY}px; --fill: {el?.fill}; --text: {el?.text}"
			aria-hidden="true"
		>
			{drag.el}
		</div>
	{/if}

	{#if toast}
		<div class="toast" class:quest={toast.kind === 'quest'}>{toast.text}</div>
	{/if}
</div>

<style>
	.page {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: 0.75rem 0.75rem 0.5rem;
		gap: 0.6rem;
		overflow: hidden;
		position: relative;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.head {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	.back-link {
		text-decoration: none;
		color: var(--rp-love);
		border: 2px solid var(--rp-love);
		padding: 0.4rem 0.6rem;
		border-radius: 3px;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.8rem;
		text-shadow: 0 0 4px var(--rp-love);
		justify-self: start;
	}

	.prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		color: var(--rp-text);
		text-shadow:
			0 0 10px var(--rp-iris),
			0 0 20px rgba(196, 167, 231, 0.6);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		letter-spacing: 0.15em;
		justify-self: center;
	}
	.prompt-bracket {
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
	}
	.prompt-cursor {
		color: var(--rp-foam);
		animation: blink 1s steps(2, start) infinite;
	}

	@keyframes blink {
		to {
			visibility: hidden;
		}
	}

	.head-actions {
		display: flex;
		gap: 0.4rem;
		justify-self: end;
	}

	.tab-btn {
		background: var(--rp-surface);
		border: 2px solid var(--rp-foam);
		color: var(--rp-foam);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.55rem;
		padding: 0.4rem 0.55rem;
		border-radius: 3px;
		cursor: pointer;
		letter-spacing: 0.1em;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		box-shadow: 0 0 6px rgba(156, 207, 216, 0.4);
	}
	.tab-btn .count {
		font-size: 0.6rem;
		color: var(--rp-gold);
	}
	.tab-btn.active {
		background: var(--rp-foam);
		color: var(--rp-base);
		box-shadow: 0 0 12px var(--rp-foam);
	}
	.tab-btn.active .count {
		color: var(--rp-base);
	}

	.stage {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-rows: 1fr auto auto auto;
		gap: 0.5rem;
		position: relative;
	}

	.workbench {
		position: relative;
		flex: 1;
		min-height: 0;
		background: radial-gradient(
				circle at 50% 50%,
				rgba(196, 167, 231, 0.12),
				transparent 65%
			),
			var(--rp-surface);
		border: 3px dashed var(--rp-iris);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 0 0 2px var(--rp-base), inset 0 0 30px rgba(196, 167, 231, 0.12);
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
	}

	.workbench.matched {
		border-style: solid;
		border-color: var(--rp-gold);
		box-shadow: 0 0 0 2px var(--rp-base), 0 0 22px var(--rp-gold),
			inset 0 0 40px rgba(246, 193, 119, 0.18);
	}

	.placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--rp-subtle);
		pointer-events: none;
	}
	.placeholder-emoji {
		font-size: 3rem;
		filter: drop-shadow(0 0 10px var(--rp-iris));
	}
	.placeholder-text {
		font-family: 'Schoolbell', cursive;
		font-size: 1.4rem;
	}

	.placed {
		position: absolute;
		width: 56px;
		height: 56px;
		margin-left: -28px;
		margin-top: -28px;
		border-radius: 50%;
		border: 3px solid var(--rp-base);
		background: var(--fill);
		color: var(--text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		touch-action: none;
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.4), 0 0 14px var(--fill);
		animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.placed:active {
		cursor: grabbing;
		transform: scale(1.08);
	}
	.placed-label {
		line-height: 1;
	}

	@keyframes pop-in {
		0% {
			transform: scale(0.2);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.molecule-stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 1rem 6.5rem;
	}

	.match-card {
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: rgba(25, 23, 36, 0.85);
		border: 2px solid var(--rp-gold);
		border-radius: 4px;
		box-shadow: 0 0 12px var(--rp-gold);
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.match-name {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.85rem;
		color: var(--rp-gold);
		text-shadow: 0 0 6px var(--rp-gold);
		letter-spacing: 0.1em;
	}
	.match-formula {
		font-family: 'VT323', monospace;
		font-size: 1.4rem;
		color: var(--rp-foam);
	}
	.match-formula sub {
		font-size: 0.85rem;
	}
	.match-fact {
		font-family: 'Schoolbell', cursive;
		font-size: 1.15rem;
		color: var(--rp-text);
	}

	.unknown-hint {
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: rgba(25, 23, 36, 0.9);
		border: 2px dashed var(--rp-love);
		border-radius: 4px;
		color: var(--rp-love);
		font-family: 'Schoolbell', cursive;
		font-size: 1.15rem;
		text-align: center;
	}

	.counts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		min-height: 2.2rem;
		align-items: center;
		padding: 0 0.2rem;
	}
	.counts-empty {
		color: var(--rp-muted);
		font-family: 'VT323', monospace;
		font-size: 1.1rem;
	}
	.count-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.5rem 0.15rem 0.3rem;
		border-radius: 999px;
		background: var(--fill);
		color: var(--text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.65rem;
		box-shadow: 0 0 8px var(--fill);
	}
	.count-sym {
		background: rgba(0, 0, 0, 0.18);
		border-radius: 999px;
		padding: 0.18rem 0.4rem;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}
	.ctrl-btn {
		flex: 1;
		max-width: 220px;
		background: var(--rp-surface);
		border: 2px solid var(--rp-gold);
		color: var(--rp-gold);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.75rem;
		padding: 0.55rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		letter-spacing: 0.12em;
		box-shadow: 0 0 8px rgba(246, 193, 119, 0.5);
	}
	.ctrl-btn.clear {
		border-color: var(--rp-love);
		color: var(--rp-love);
		box-shadow: 0 0 8px rgba(235, 111, 146, 0.5);
	}
	.ctrl-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		box-shadow: none;
	}
	.ctrl-btn:not(:disabled):hover {
		transform: translateY(-2px);
	}

	.tray {
		list-style: none;
		margin: 0;
		display: flex;
		gap: 0.45rem;
		overflow-x: auto;
		padding: 0.4rem 0.2rem 0.5rem;
		scroll-snap-type: x proximity;
		-webkit-overflow-scrolling: touch;
	}
	.tile {
		flex: 0 0 auto;
		min-width: 78px;
		background: var(--fill);
		color: var(--text);
		border: 3px solid var(--rp-base);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0;
		box-shadow: 0 0 10px var(--fill);
		scroll-snap-align: start;
		overflow: hidden;
	}

	.tile-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.4rem 0.5rem 0.35rem;
		cursor: grab;
		touch-action: none;
	}
	.tile-body:active {
		cursor: grabbing;
	}

	.tile-symbol {
		font-family: 'Press Start 2P', cursive;
		font-size: 1rem;
		line-height: 1;
	}
	.tile-name {
		font-family: 'VT323', monospace;
		font-size: 0.85rem;
		opacity: 0.85;
	}

	.tile-counter {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(0, 0, 0, 0.18);
		padding: 0 0.1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.25);
	}
	.tile-step {
		background: transparent;
		border: none;
		color: var(--text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.9rem;
		padding: 0.35rem 0.6rem;
		cursor: pointer;
		touch-action: manipulation;
		min-width: 28px;
		min-height: 32px;
		line-height: 1;
	}
	.tile-step:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.tile-step:active:not(:disabled) {
		transform: scale(0.9);
	}
	.tile-count {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		min-width: 18px;
		text-align: center;
		color: var(--text);
	}

	.ghost {
		position: fixed;
		pointer-events: none;
		width: 56px;
		height: 56px;
		margin-left: -28px;
		margin-top: -28px;
		border-radius: 50%;
		border: 3px solid var(--rp-base);
		background: var(--fill);
		color: var(--text);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 18px var(--fill), 0 0 30px rgba(0, 0, 0, 0.5);
		z-index: 9999;
		transform: scale(1.05);
	}

	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(25, 23, 36, 0.96);
		border: 3px solid var(--rp-foam);
		border-radius: 8px;
		box-shadow: 0 0 14px var(--rp-foam);
		display: flex;
		flex-direction: column;
		z-index: 50;
	}
	.overlay-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		border-bottom: 2px solid var(--rp-foam);
	}
	.overlay-head h3 {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.9rem;
		color: var(--rp-foam);
		text-shadow: 0 0 8px var(--rp-foam);
		letter-spacing: 0.15em;
		margin: 0;
	}
	.overlay-close {
		background: transparent;
		border: 2px solid var(--rp-love);
		color: var(--rp-love);
		font-family: 'Press Start 2P', cursive;
		padding: 0.3rem 0.5rem;
		border-radius: 3px;
		cursor: pointer;
	}

	.journal-grid {
		flex: 1;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.7rem;
		padding: 0.7rem;
	}
	.journal-card {
		background: var(--rp-surface);
		border: 2px solid var(--rp-hl-med);
		border-radius: 6px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		min-height: 180px;
	}
	.journal-card.found {
		border-color: var(--rp-gold);
		box-shadow: 0 0 8px rgba(246, 193, 119, 0.45);
	}
	.journal-thumb {
		width: 100%;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.journal-thumb.locked {
		font-family: 'Press Start 2P', cursive;
		font-size: 2.4rem;
		color: var(--rp-hl-high);
	}
	.journal-name {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.65rem;
		color: var(--rp-text);
		letter-spacing: 0.08em;
		text-align: center;
	}
	.journal-name.locked {
		color: var(--rp-hl-high);
	}
	.journal-formula {
		font-family: 'VT323', monospace;
		font-size: 1.1rem;
		color: var(--rp-foam);
	}
	.journal-formula sub {
		font-size: 0.75rem;
	}
	.journal-fact {
		font-family: 'Schoolbell', cursive;
		font-size: 0.95rem;
		color: var(--rp-subtle);
		text-align: center;
	}

	.quests-list {
		flex: 1;
		overflow-y: auto;
		list-style: none;
		padding: 0.7rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.quest {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: var(--rp-surface);
		border: 2px solid var(--rp-hl-med);
		border-radius: 6px;
		padding: 0.55rem 0.7rem;
	}
	.quest.done {
		border-color: var(--rp-gold);
		box-shadow: 0 0 8px rgba(246, 193, 119, 0.5);
	}
	.quest-check {
		font-family: 'Press Start 2P', cursive;
		font-size: 1.3rem;
		color: var(--rp-hl-high);
	}
	.quest.done .quest-check {
		color: var(--rp-gold);
		text-shadow: 0 0 8px var(--rp-gold);
	}
	.quest-body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.quest-prompt {
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		color: var(--rp-text);
		letter-spacing: 0.05em;
	}
	.quest-hint {
		font-family: 'Schoolbell', cursive;
		font-size: 1rem;
		color: var(--rp-subtle);
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		background: var(--rp-base);
		border: 3px solid var(--rp-gold);
		color: var(--rp-gold);
		font-family: 'Press Start 2P', cursive;
		font-size: 0.7rem;
		padding: 0.6rem 0.9rem;
		border-radius: 4px;
		box-shadow: 0 0 18px var(--rp-gold);
		letter-spacing: 0.1em;
		z-index: 9999;
		animation: toast-in 0.3s ease-out;
		max-width: 90vw;
		text-align: center;
	}
	.toast.quest {
		border-color: var(--rp-foam);
		color: var(--rp-foam);
		box-shadow: 0 0 18px var(--rp-foam);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
</style>
