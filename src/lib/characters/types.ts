export type CharacterId = 'jane' | 'isla' | 'ollie' | 'mommy' | 'daddy';

export interface Pronouns {
	they: string;
	them: string;
	their: string;
	theirs: string;
	themselves: string;
}

export interface Character {
	id: CharacterId;
	name: string;
	title: string;
	emoji: string;
	pronouns: Pronouns;
	accent: string;
	description?: string;
}
