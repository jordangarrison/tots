// Letter → object association for pre-readers. The free-play mode shows the
// emoji + spoken word when a kid presses a key, turning the keyboard into a
// pictionary. Picks favor concepts a 2–4 year old already recognizes.

export interface LetterAssoc {
	emoji: string;
	word: string;
}

export const LETTER_ASSOC: Record<string, LetterAssoc> = {
	a: { emoji: '🍎', word: 'apple' },
	b: { emoji: '🐻', word: 'bear' },
	c: { emoji: '🐱', word: 'cat' },
	d: { emoji: '🐶', word: 'dog' },
	e: { emoji: '🥚', word: 'egg' },
	f: { emoji: '🐟', word: 'fish' },
	g: { emoji: '🍇', word: 'grapes' },
	h: { emoji: '🏠', word: 'house' },
	i: { emoji: '🍦', word: 'ice cream' },
	j: { emoji: '🤹', word: 'juggle' },
	k: { emoji: '🪁', word: 'kite' },
	l: { emoji: '🦁', word: 'lion' },
	m: { emoji: '🌝', word: 'moon' },
	n: { emoji: '🪺', word: 'nest' },
	o: { emoji: '🐙', word: 'octopus' },
	p: { emoji: '🥧', word: 'pie' },
	q: { emoji: '👸', word: 'queen' },
	r: { emoji: '🌈', word: 'rainbow' },
	s: { emoji: '☀️', word: 'sun' },
	t: { emoji: '🌳', word: 'tree' },
	u: { emoji: '☂️', word: 'umbrella' },
	v: { emoji: '🚐', word: 'van' },
	w: { emoji: '🌊', word: 'wave' },
	x: { emoji: '❎', word: 'x' },
	y: { emoji: '🪀', word: 'yo-yo' },
	z: { emoji: '🦓', word: 'zebra' }
};

export function assocFor(char: string): LetterAssoc | undefined {
	return LETTER_ASSOC[char.toLowerCase()];
}
