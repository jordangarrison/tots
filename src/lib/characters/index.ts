import type { Character, CharacterId } from './types';

export const characters: Record<CharacterId, Character> = {
	jane: {
		id: 'jane',
		name: 'Jane',
		title: 'Princess',
		emoji: '👸',
		pronouns: {
			they: 'she',
			them: 'her',
			their: 'her',
			theirs: 'hers',
			themselves: 'herself'
		},
		accent: 'var(--rp-love)'
	},
	isla: {
		id: 'isla',
		name: 'Isla',
		title: 'Princess',
		emoji: '👸🏼',
		pronouns: {
			they: 'she',
			them: 'her',
			their: 'her',
			theirs: 'hers',
			themselves: 'herself'
		},
		accent: 'var(--rp-iris)'
	},
	ollie: {
		id: 'ollie',
		name: 'Ollie',
		title: 'Prince',
		emoji: '🐶',
		pronouns: {
			they: 'he',
			them: 'him',
			their: 'his',
			theirs: 'his',
			themselves: 'himself'
		},
		accent: 'var(--rp-foam)',
		description: 'A miniature Australian shepherd with a very short tail.'
	}
};

export const characterOrder: CharacterId[] = ['jane', 'isla', 'ollie'];

export type { Character, CharacterId, Pronouns } from './types';
