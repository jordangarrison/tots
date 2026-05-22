export const SAVE_KEY = 'tots:molecules:v1';

export interface Element {
	symbol: string;
	name: string;
	atomicNumber: number;
	fill: string;
	text: string;
}

export interface MoleculeAtom {
	el: string;
	x: number;
	y: number;
}

export interface MoleculeBond {
	from: number;
	to: number;
	order: 1 | 2 | 3;
}

export interface Molecule {
	key: string;
	formula: string;
	name: string;
	fact: string;
	atoms: MoleculeAtom[];
	bonds: MoleculeBond[];
}

export interface Quest {
	id: string;
	prompt: string;
	hint: string;
	target: string;
}

export interface MoleculesSave {
	version: 1;
	discovered: Record<string, { firstSeen: number }>;
	questsCompleted: Record<string, number>;
}

export interface FormulaPart {
	el: string;
	n?: number;
}

const SUB_DIGITS = /^[0-9]+$/;

export function parseFormula(formula: string): FormulaPart[] {
	const parts: FormulaPart[] = [];
	let i = 0;
	while (i < formula.length) {
		const c = formula[i];
		if (c >= 'A' && c <= 'Z') {
			let sym = c;
			i++;
			if (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') {
				sym += formula[i];
				i++;
			}
			let num = '';
			while (i < formula.length && SUB_DIGITS.test(formula[i])) {
				num += formula[i];
				i++;
			}
			parts.push(num ? { el: sym, n: Number(num) } : { el: sym });
		} else {
			i++;
		}
	}
	return parts;
}

export function keyFor(atoms: string[]): string {
	if (atoms.length === 0) return '';
	const counts = new Map<string, number>();
	for (const a of atoms) counts.set(a, (counts.get(a) ?? 0) + 1);
	const sorted = [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return sorted.map(([sym, n]) => (n > 1 ? `${sym}${n}` : sym)).join('');
}
