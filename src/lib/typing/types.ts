// Standard touch-typing finger model. Each finger is mapped to a hand and slot
// number so we can color-code keys and highlight the hand diagram.

export type Hand = 'left' | 'right';

// Finger index within a hand. 0 = thumb, 1 = index, 2 = middle, 3 = ring, 4 = pinky.
export type FingerIndex = 0 | 1 | 2 | 3 | 4;

export interface Finger {
	hand: Hand;
	index: FingerIndex;
	/** Stable id used for color lookup, e.g. "L1" for left index. */
	id: string;
	/** Kid-friendly display name. */
	label: string;
	/** CSS color (rose-pine palette) for this finger across the UI. */
	color: string;
}

export interface KeyDef {
	/** Lowercase character the key produces (or " " for space). */
	char: string;
	/** Display glyph for the key cap. */
	label: string;
	/** Which finger should press this key. */
	finger: Finger;
	/** Visual row index (0 = numbers, 1 = top, 2 = home, 3 = bottom, 4 = space). */
	row: 0 | 1 | 2 | 3 | 4;
	/** Used to draw the bump indicator on F and J. */
	homeAnchor?: boolean;
}

export type DrillKind = 'keys' | 'words';

export interface Drill {
	kind: DrillKind;
	/** Space-separated list of words, or a string of single characters. */
	content: string;
	/** Friendly hint shown above the drill. */
	hint?: string;
}

export interface Lesson {
	id: string;
	title: string;
	description: string;
	emoji: string;
	/** Keys this lesson is teaching for the first time. */
	newKeys: string[];
	/** Keys reviewed alongside the new ones. */
	reviewKeys: string[];
	/** Difficulty tier for sorting / picker labels. */
	tier: 'home' | 'top' | 'bottom' | 'words' | 'space';
	drills: Drill[];
}

export interface LessonResult {
	lessonId: string;
	/** 1-3 stars. 3 = >=95% accuracy, 2 = >=80%, 1 = finished. */
	stars: 1 | 2 | 3;
	accuracy: number;
	totalKeys: number;
	mistakes: number;
}

export interface TypingSave {
	version: 1;
	completed: Record<string, LessonResult>;
}

export const SAVE_KEY = 'tots.typing.save.v1';
