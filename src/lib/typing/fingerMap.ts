// Standard QWERTY touch-typing finger assignments. Each finger gets a stable id
// and a rose-pine accent color we reuse across the keyboard, the hands diagram,
// and the lesson "press this finger" indicator. The kid-friendly labels are
// what we surface in the prompt ("Use your LEFT INDEX finger!").

import type { Finger, KeyDef } from './types';

const F = {
	leftPinky: { hand: 'left', index: 4, id: 'L4', label: 'left pinky', color: '#eb6f92' },
	leftRing: { hand: 'left', index: 3, id: 'L3', label: 'left ring', color: '#f6c177' },
	leftMiddle: { hand: 'left', index: 2, id: 'L2', label: 'left middle', color: '#ebbcba' },
	leftIndex: { hand: 'left', index: 1, id: 'L1', label: 'left index', color: '#c4a7e7' },
	leftThumb: { hand: 'left', index: 0, id: 'L0', label: 'left thumb', color: '#9ccfd8' },
	rightThumb: { hand: 'right', index: 0, id: 'R0', label: 'right thumb', color: '#9ccfd8' },
	rightIndex: { hand: 'right', index: 1, id: 'R1', label: 'right index', color: '#c4a7e7' },
	rightMiddle: { hand: 'right', index: 2, id: 'R2', label: 'right middle', color: '#ebbcba' },
	rightRing: { hand: 'right', index: 3, id: 'R3', label: 'right ring', color: '#f6c177' },
	rightPinky: { hand: 'right', index: 4, id: 'R4', label: 'right pinky', color: '#eb6f92' }
} as const satisfies Record<string, Finger>;

export const FINGERS = F;

// Helper to keep the table below tight & readable.
const k = (
	char: string,
	label: string,
	row: KeyDef['row'],
	finger: Finger,
	homeAnchor = false
): KeyDef => ({
	char,
	label,
	row,
	finger,
	homeAnchor
});

export const KEYBOARD_ROWS: KeyDef[][] = [
	// Top letter row
	[
		k('q', 'Q', 1, F.leftPinky),
		k('w', 'W', 1, F.leftRing),
		k('e', 'E', 1, F.leftMiddle),
		k('r', 'R', 1, F.leftIndex),
		k('t', 'T', 1, F.leftIndex),
		k('y', 'Y', 1, F.rightIndex),
		k('u', 'U', 1, F.rightIndex),
		k('i', 'I', 1, F.rightMiddle),
		k('o', 'O', 1, F.rightRing),
		k('p', 'P', 1, F.rightPinky)
	],
	// Home row
	[
		k('a', 'A', 2, F.leftPinky),
		k('s', 'S', 2, F.leftRing),
		k('d', 'D', 2, F.leftMiddle),
		k('f', 'F', 2, F.leftIndex, true),
		k('g', 'G', 2, F.leftIndex),
		k('h', 'H', 2, F.rightIndex),
		k('j', 'J', 2, F.rightIndex, true),
		k('k', 'K', 2, F.rightMiddle),
		k('l', 'L', 2, F.rightRing),
		k(';', ';', 2, F.rightPinky)
	],
	// Bottom letter row
	[
		k('z', 'Z', 3, F.leftPinky),
		k('x', 'X', 3, F.leftRing),
		k('c', 'C', 3, F.leftMiddle),
		k('v', 'V', 3, F.leftIndex),
		k('b', 'B', 3, F.leftIndex),
		k('n', 'N', 3, F.rightIndex),
		k('m', 'M', 3, F.rightIndex),
		k(',', ',', 3, F.rightMiddle),
		k('.', '.', 3, F.rightRing),
		k('/', '/', 3, F.rightPinky)
	],
	// Space bar (rendered as a single wide key)
	[k(' ', 'SPACE', 4, F.rightThumb)]
];

const lookup = new Map<string, KeyDef>();
for (const row of KEYBOARD_ROWS) for (const key of row) lookup.set(key.char, key);

export function keyFor(char: string): KeyDef | undefined {
	return lookup.get(char.toLowerCase());
}

export function fingerFor(char: string): Finger | undefined {
	return lookup.get(char.toLowerCase())?.finger;
}
