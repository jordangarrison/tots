import type { Molecule } from './types';
import { keyFor } from './types';

// Layouts use a centered coordinate system; MoleculeView scales them to fit.
// Bonds connect atom indices into the `atoms` array.

const defs: Array<Omit<Molecule, 'key'> & { atomsOrder?: string[] }> = [
	{
		formula: 'H2',
		name: 'Hydrogen Gas',
		fact: 'The lightest element. Two hydrogens hold hands to make a gas.',
		atoms: [
			{ el: 'H', x: -2, y: 0 },
			{ el: 'H', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	},
	{
		formula: 'O2',
		name: 'Oxygen',
		fact: 'The stuff you breathe in! Two oxygens share a double bond.',
		atoms: [
			{ el: 'O', x: -2, y: 0 },
			{ el: 'O', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 2 }]
	},
	{
		formula: 'N2',
		name: 'Nitrogen Gas',
		fact: 'Most of the air around you is N₂. A super-strong triple bond holds it together.',
		atoms: [
			{ el: 'N', x: -2, y: 0 },
			{ el: 'N', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 3 }]
	},
	{
		formula: 'H2O',
		name: 'Water',
		fact: 'Every living thing needs water. The molecule is bent, not straight!',
		atoms: [
			{ el: 'O', x: 0, y: -0.6 },
			{ el: 'H', x: -2.4, y: 1 },
			{ el: 'H', x: 2.4, y: 1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 }
		]
	},
	{
		formula: 'CO2',
		name: 'Carbon Dioxide',
		fact: 'The gas you breathe out. Plants love it.',
		atoms: [
			{ el: 'C', x: 0, y: 0 },
			{ el: 'O', x: -3, y: 0 },
			{ el: 'O', x: 3, y: 0 }
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 0, to: 2, order: 2 }
		]
	},
	{
		formula: 'CO',
		name: 'Carbon Monoxide',
		fact: 'A sneaky gas — invisible and dangerous. Detectors keep homes safe.',
		atoms: [
			{ el: 'C', x: -1.6, y: 0 },
			{ el: 'O', x: 1.6, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 3 }]
	},
	{
		formula: 'CH4',
		name: 'Methane',
		fact: 'Cows burp this! It also heats stovetops.',
		atoms: [
			{ el: 'C', x: 0, y: 0 },
			{ el: 'H', x: 0, y: -2.6 },
			{ el: 'H', x: 2.6, y: 0 },
			{ el: 'H', x: 0, y: 2.6 },
			{ el: 'H', x: -2.6, y: 0 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 }
		]
	},
	{
		formula: 'NH3',
		name: 'Ammonia',
		fact: 'A stinky gas used in cleaning sprays. Made of one nitrogen and three hydrogens.',
		atoms: [
			{ el: 'N', x: 0, y: 0 },
			{ el: 'H', x: 0, y: -2.6 },
			{ el: 'H', x: -2.25, y: 1.3 },
			{ el: 'H', x: 2.25, y: 1.3 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 }
		]
	},
	{
		formula: 'HCl',
		name: 'Hydrochloric Acid',
		fact: 'A strong acid — your stomach makes it to digest food!',
		atoms: [
			{ el: 'H', x: -2, y: 0 },
			{ el: 'Cl', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	},
	{
		formula: 'HF',
		name: 'Hydrogen Fluoride',
		fact: 'Used to etch glass. Very dangerous to touch!',
		atoms: [
			{ el: 'H', x: -2, y: 0 },
			{ el: 'F', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	},
	{
		formula: 'NaCl',
		name: 'Table Salt',
		fact: 'Sprinkle this on fries! Sodium gives an electron to chlorine.',
		atoms: [
			{ el: 'Na', x: -2, y: 0 },
			{ el: 'Cl', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	},
	{
		formula: 'O3',
		name: 'Ozone',
		fact: 'High in the sky, ozone blocks sunburn rays from the sun.',
		atoms: [
			{ el: 'O', x: 0, y: -0.6 },
			{ el: 'O', x: -2.6, y: 1 },
			{ el: 'O', x: 2.6, y: 1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 0, to: 2, order: 1 }
		]
	},
	{
		formula: 'C2H6',
		name: 'Ethane',
		fact: 'A fuel gas, cousin of methane. Two carbons in a row.',
		atoms: [
			{ el: 'C', x: -1.4, y: 0 },
			{ el: 'C', x: 1.4, y: 0 },
			{ el: 'H', x: -3.4, y: -1.6 },
			{ el: 'H', x: -3.4, y: 1.6 },
			{ el: 'H', x: -1.4, y: -2.4 },
			{ el: 'H', x: 3.4, y: -1.6 },
			{ el: 'H', x: 3.4, y: 1.6 },
			{ el: 'H', x: 1.4, y: -2.4 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 1, to: 5, order: 1 },
			{ from: 1, to: 6, order: 1 },
			{ from: 1, to: 7, order: 1 }
		]
	},
	{
		formula: 'Fe2O3',
		name: 'Rust',
		fact: 'When iron meets oxygen and water, you get rust. Same stuff on old bikes.',
		atoms: [
			{ el: 'O', x: -4.4, y: 0 },
			{ el: 'Fe', x: -2.2, y: 0 },
			{ el: 'O', x: 0, y: 0 },
			{ el: 'Fe', x: 2.2, y: 0 },
			{ el: 'O', x: 4.4, y: 0 }
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 1 },
			{ from: 3, to: 4, order: 2 }
		]
	},
	{
		formula: 'MgO',
		name: 'Magnesia',
		fact: 'A white powder gymnasts and weightlifters chalk on their hands.',
		atoms: [
			{ el: 'Mg', x: -2, y: 0 },
			{ el: 'O', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	},
	{
		formula: 'CaO',
		name: 'Quicklime',
		fact: 'Used to make cement. Made by cooking limestone in a kiln.',
		atoms: [
			{ el: 'Ca', x: -2, y: 0 },
			{ el: 'O', x: 2, y: 0 }
		],
		bonds: [{ from: 0, to: 1, order: 1 }]
	}
];

export const MOLECULES: Molecule[] = defs.map((m) => ({
	...m,
	key: keyFor(m.atoms.map((a) => a.el))
}));

export const MOLECULE_BY_KEY: Record<string, Molecule> = Object.fromEntries(
	MOLECULES.map((m) => [m.key, m])
);
