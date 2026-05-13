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
	extras: { homeAnchor?: boolean; isModifier?: boolean; isWide?: boolean } = {}
): KeyDef => ({ char, label, row, finger, ...extras });

export const SHIFT_L_ID = 'shift-l';
export const SHIFT_R_ID = 'shift-r';

export const KEYBOARD_ROWS: KeyDef[][] = [
	// Number row
	[
		k('1', '1', 0, F.leftPinky),
		k('2', '2', 0, F.leftRing),
		k('3', '3', 0, F.leftMiddle),
		k('4', '4', 0, F.leftIndex),
		k('5', '5', 0, F.leftIndex),
		k('6', '6', 0, F.rightIndex),
		k('7', '7', 0, F.rightIndex),
		k('8', '8', 0, F.rightMiddle),
		k('9', '9', 0, F.rightRing),
		k('0', '0', 0, F.rightPinky)
	],
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
	// Home row (with apostrophe at the end)
	[
		k('a', 'A', 2, F.leftPinky),
		k('s', 'S', 2, F.leftRing),
		k('d', 'D', 2, F.leftMiddle),
		k('f', 'F', 2, F.leftIndex, { homeAnchor: true }),
		k('g', 'G', 2, F.leftIndex),
		k('h', 'H', 2, F.rightIndex),
		k('j', 'J', 2, F.rightIndex, { homeAnchor: true }),
		k('k', 'K', 2, F.rightMiddle),
		k('l', 'L', 2, F.rightRing),
		k(';', ';', 2, F.rightPinky),
		k("'", "'", 2, F.rightPinky)
	],
	// Bottom row, with Shift on the ends like a real keyboard
	[
		k(SHIFT_L_ID, '⇧', 3, F.leftPinky, { isModifier: true, isWide: true }),
		k('z', 'Z', 3, F.leftPinky),
		k('x', 'X', 3, F.leftRing),
		k('c', 'C', 3, F.leftMiddle),
		k('v', 'V', 3, F.leftIndex),
		k('b', 'B', 3, F.leftIndex),
		k('n', 'N', 3, F.rightIndex),
		k('m', 'M', 3, F.rightIndex),
		k(',', ',', 3, F.rightMiddle),
		k('.', '.', 3, F.rightRing),
		k('/', '/', 3, F.rightPinky),
		k(SHIFT_R_ID, '⇧', 3, F.rightPinky, { isModifier: true, isWide: true })
	],
	// Space bar
	[k(' ', 'SPACE', 4, F.rightThumb, { isWide: true })]
];

// Shifted character → base character. Used to resolve the underlying key for
// shifted targets like "A", "!", "?" so we can highlight the right finger and
// know which shift side to press.
const SHIFT_MAP: Record<string, string> = {
	'!': '1',
	'@': '2',
	'#': '3',
	$: '4',
	'%': '5',
	'^': '6',
	'&': '7',
	'*': '8',
	'(': '9',
	')': '0',
	'?': '/',
	':': ';',
	'"': "'",
	'<': ',',
	'>': '.'
};

const lookup = new Map<string, KeyDef>();
for (const row of KEYBOARD_ROWS) {
	for (const key of row) {
		if (!key.isModifier) lookup.set(key.char, key);
	}
}

/** Returns the underlying lowercase / unshifted key character for any input. */
export function baseChar(char: string): string {
	if (char in SHIFT_MAP) return SHIFT_MAP[char];
	return char.toLowerCase();
}

/** True if producing this character on a US keyboard requires the Shift key. */
export function needsShift(char: string): boolean {
	if (char in SHIFT_MAP) return true;
	return (
		char.length === 1 && char !== char.toLowerCase() && char.toLowerCase() !== char.toUpperCase()
	);
}

export function keyFor(char: string): KeyDef | undefined {
	return lookup.get(baseChar(char));
}

export function fingerFor(char: string): Finger | undefined {
	return keyFor(char)?.finger;
}

/** The pinky that should press SHIFT — always the OPPOSITE hand from the letter. */
export function shiftFingerFor(char: string): Finger | undefined {
	const f = fingerFor(char);
	if (!f) return undefined;
	return f.hand === 'left' ? F.rightPinky : F.leftPinky;
}

/** Which Shift key id ("shift-l" or "shift-r") corresponds to the typing letter's opposite hand. */
export function shiftKeyIdFor(char: string): typeof SHIFT_L_ID | typeof SHIFT_R_ID | null {
	const f = fingerFor(char);
	if (!f) return null;
	return f.hand === 'left' ? SHIFT_R_ID : SHIFT_L_ID;
}
