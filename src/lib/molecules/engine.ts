import type { Molecule } from './types';
import { keyFor } from './types';
import { MOLECULE_BY_KEY } from './molecules';

export type ReactionResult =
	| { status: 'empty' }
	| { status: 'matched'; molecule: Molecule }
	| { status: 'unknown'; key: string };

export function combine(atomSymbols: string[]): ReactionResult {
	if (atomSymbols.length === 0) return { status: 'empty' };
	const key = keyFor(atomSymbols);
	const molecule = MOLECULE_BY_KEY[key];
	if (molecule) return { status: 'matched', molecule };
	return { status: 'unknown', key };
}
