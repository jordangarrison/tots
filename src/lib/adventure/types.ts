export type CharacterId = 'jane' | 'isla' | 'ollie';

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
}

export interface Choice {
	label: string;
	nextId: string;
}

export interface SceneArt {
	emoji: string;
	background?: string;
	imageUrl?: string;
}

export type SceneKind = 'story' | 'rest' | 'ending';

export interface Scene {
	id: string;
	kind?: SceneKind;
	art: SceneArt;
	narration: string[];
	feelingNote?: string;
	flavor?: Partial<Record<CharacterId, string>>;
	choices: Choice[];
	audio?: unknown;
}

export interface Story {
	id: string;
	title: string;
	startId: string;
	restId: string;
	scenes: Record<string, Scene>;
}

export function format(text: string, character: Character): string {
	const { name, title, pronouns } = character;
	const map: Record<string, string> = {
		name,
		Name: name,
		title: title.toLowerCase(),
		Title: title,
		they: pronouns.they,
		They: cap(pronouns.they),
		them: pronouns.them,
		Them: cap(pronouns.them),
		their: pronouns.their,
		Their: cap(pronouns.their),
		theirs: pronouns.theirs,
		Theirs: cap(pronouns.theirs),
		themselves: pronouns.themselves,
		Themselves: cap(pronouns.themselves)
	};
	return text.replace(/\{(\w+)\}/g, (whole, key) => (key in map ? map[key] : whole));
}

function cap(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
