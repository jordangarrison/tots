import type { PlotKind, PlotStage, PlotState } from './types';

// Time (ms) for each growth transition. Kids should see progress fast.
export const STAGE_DURATIONS_MS: Record<Exclude<PlotStage, 'bloomed' | 'empty'>, number> = {
	seeded: 4000,
	sprout: 8000,
	regrowing: 12000
};

export function plant(now: number): PlotState {
	return { stage: 'seeded', stageStartedAt: now };
}

export function pickLavender(now: number): PlotState {
	return { stage: 'regrowing', stageStartedAt: now };
}

// Returns the plot state advanced to the correct stage given the current time.
// Pure — never mutates the input. Returns `null` when the plot has returned to
// its default (no-row) state so the caller can delete it.
export function advance(state: PlotState, kind: PlotKind, now: number): PlotState | null {
	let cur = state;
	// Walk the state machine until we can't advance any further.
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const next = step(cur, kind, now);
		if (next === null) return null;
		if (next === cur) return cur;
		cur = next;
	}
}

function step(state: PlotState, kind: PlotKind, now: number): PlotState | null {
	const elapsed = now - state.stageStartedAt;
	if (kind === 'rose' || kind === 'bluebonnet') {
		if (state.stage === 'seeded' && elapsed >= STAGE_DURATIONS_MS.seeded) {
			return { stage: 'sprout', stageStartedAt: state.stageStartedAt + STAGE_DURATIONS_MS.seeded };
		}
		if (state.stage === 'sprout' && elapsed >= STAGE_DURATIONS_MS.sprout) {
			return {
				stage: 'bloomed',
				stageStartedAt: state.stageStartedAt + STAGE_DURATIONS_MS.sprout
			};
		}
	}
	if (kind === 'lavender') {
		if (state.stage === 'regrowing' && elapsed >= STAGE_DURATIONS_MS.regrowing) {
			// Lavender's default state is "bloomed", represented by no state row.
			return null;
		}
	}
	return state;
}

export function harvest(): PlotState | null {
	// Harvested plots return to empty (no state row needed — caller deletes).
	return null;
}

export function isHarvestable(state: PlotState | undefined, kind: PlotKind): boolean {
	if (kind === 'rose') return state?.stage === 'bloomed';
	if (kind === 'lavender') return !state || state.stage === 'empty';
	// Bluebonnets are never harvested — Queen Mommy says no picking!
	return false;
}
