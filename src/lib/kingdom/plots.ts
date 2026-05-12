import type { PlotStage, PlotState } from './types';

// Time (ms) for each growth transition. Kids should see progress fast.
export const STAGE_DURATIONS_MS: Record<Exclude<PlotStage, 'bloomed' | 'empty'>, number> = {
	seeded: 4000,
	sprout: 8000
};

export function plant(now: number): PlotState {
	return { stage: 'seeded', stageStartedAt: now };
}

// Returns the plot state advanced to the correct stage given the current time.
// Pure — never mutates the input.
export function advance(state: PlotState, now: number): PlotState {
	let cur = state;
	// Walk the state machine until we can't advance any further.
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const next = step(cur, now);
		if (next === cur) return cur;
		cur = next;
	}
}

function step(state: PlotState, now: number): PlotState {
	const elapsed = now - state.stageStartedAt;
	if (state.stage === 'seeded' && elapsed >= STAGE_DURATIONS_MS.seeded) {
		return { stage: 'sprout', stageStartedAt: state.stageStartedAt + STAGE_DURATIONS_MS.seeded };
	}
	if (state.stage === 'sprout' && elapsed >= STAGE_DURATIONS_MS.sprout) {
		return {
			stage: 'bloomed',
			stageStartedAt: state.stageStartedAt + STAGE_DURATIONS_MS.sprout
		};
	}
	return state;
}

export function harvest(): PlotState | null {
	// Harvested plots return to empty (no state row needed — caller deletes).
	return null;
}

export function isHarvestable(state: PlotState | undefined): boolean {
	return state?.stage === 'bloomed';
}
