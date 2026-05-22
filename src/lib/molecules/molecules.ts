import type { Molecule, MoleculeAtom } from './types';
import { keyFor } from './types';

// Layouts use a centered coordinate system; MoleculeView scales them to fit.
// Bonds connect atom indices into the `atoms` array. Bond orders: 1 single,
// 2 double, 3 triple. y grows downward (SVG convention).

// Build a regular polygon ring of atoms. startAngle is in degrees, 0 = east,
// rotating clockwise (since y grows downward). startAngle = -90 puts the first
// atom at the top.
function ring(symbols: string[], cx: number, cy: number, r: number, startAngle = -90): MoleculeAtom[] {
	const n = symbols.length;
	return symbols.map((el, i) => {
		const a = ((startAngle + (360 / n) * i) * Math.PI) / 180;
		return { el, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
	});
}

const defs: Array<Omit<Molecule, 'key'>> = [
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
		formula: 'H2O2',
		name: 'Hydrogen Peroxide',
		fact: 'The bubbly stuff that cleans cuts. Two oxygens linked together.',
		atoms: [
			{ el: 'H', x: -3.6, y: 1 },
			{ el: 'O', x: -1.2, y: 0 },
			{ el: 'O', x: 1.2, y: 0 },
			{ el: 'H', x: 3.6, y: -1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 1 }
		]
	},
	{
		formula: 'CH3OH',
		name: 'Methanol',
		fact: 'Also called wood alcohol. Used as fuel in racing cars — and very poisonous to drink.',
		atoms: [
			{ el: 'C', x: -1, y: 0 },
			{ el: 'O', x: 1.4, y: 0 },
			{ el: 'H', x: -2.6, y: 0 },
			{ el: 'H', x: -1.6, y: -1.4 },
			{ el: 'H', x: -1.6, y: 1.4 },
			{ el: 'H', x: 2.8, y: -1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 1, to: 5, order: 1 }
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
		formula: 'C2H6O',
		name: 'Ethanol',
		fact: 'The alcohol in beer and wine. Also used as hand sanitizer.',
		atoms: [
			{ el: 'C', x: -2.6, y: 0 },
			{ el: 'C', x: 0, y: 0 },
			{ el: 'O', x: 2.4, y: 0 },
			{ el: 'H', x: -4.1, y: 0 },
			{ el: 'H', x: -3.1, y: -1.4 },
			{ el: 'H', x: -3.1, y: 1.4 },
			{ el: 'H', x: 0, y: -1.5 },
			{ el: 'H', x: 0, y: 1.5 },
			{ el: 'H', x: 3.6, y: -1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 0, to: 5, order: 1 },
			{ from: 1, to: 6, order: 1 },
			{ from: 1, to: 7, order: 1 },
			{ from: 2, to: 8, order: 1 }
		]
	},
	{
		formula: 'C2H4O2',
		name: 'Acetic Acid',
		fact: 'Vinegar! The sour stuff on salad and fish-and-chips.',
		atoms: [
			{ el: 'C', x: -2.4, y: 0 },
			{ el: 'C', x: 0, y: 0 },
			{ el: 'O', x: 1, y: -1.6 },
			{ el: 'O', x: 1, y: 1.6 },
			{ el: 'H', x: -3.9, y: 0 },
			{ el: 'H', x: -2.9, y: -1.4 },
			{ el: 'H', x: -2.9, y: 1.4 },
			{ el: 'H', x: 2.5, y: 1.9 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 2 },
			{ from: 1, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 0, to: 5, order: 1 },
			{ from: 0, to: 6, order: 1 },
			{ from: 3, to: 7, order: 1 }
		]
	},
	{
		formula: 'C3H6O',
		name: 'Acetone',
		fact: 'The smell of nail polish remover. Great at dissolving things.',
		atoms: [
			{ el: 'C', x: -2.6, y: 0 },
			{ el: 'C', x: 0, y: 0 },
			{ el: 'C', x: 2.6, y: 0 },
			{ el: 'O', x: 0, y: -1.7 },
			{ el: 'H', x: -4.1, y: 0 },
			{ el: 'H', x: -3.1, y: -1.4 },
			{ el: 'H', x: -3.1, y: 1.4 },
			{ el: 'H', x: 4.1, y: 0 },
			{ el: 'H', x: 3.1, y: -1.4 },
			{ el: 'H', x: 3.1, y: 1.4 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 1, to: 3, order: 2 },
			{ from: 0, to: 4, order: 1 },
			{ from: 0, to: 5, order: 1 },
			{ from: 0, to: 6, order: 1 },
			{ from: 2, to: 7, order: 1 },
			{ from: 2, to: 8, order: 1 },
			{ from: 2, to: 9, order: 1 }
		]
	},
	{
		formula: 'C3H8',
		name: 'Propane',
		fact: 'The fuel inside backyard barbecue tanks. Three carbons in a chain.',
		atoms: [
			{ el: 'C', x: -3, y: 0 },
			{ el: 'C', x: 0, y: 0 },
			{ el: 'C', x: 3, y: 0 },
			{ el: 'H', x: -4.5, y: 0 },
			{ el: 'H', x: -3.5, y: -1.4 },
			{ el: 'H', x: -3.5, y: 1.4 },
			{ el: 'H', x: 0, y: -1.6 },
			{ el: 'H', x: 0, y: 1.6 },
			{ el: 'H', x: 4.5, y: 0 },
			{ el: 'H', x: 3.5, y: -1.4 },
			{ el: 'H', x: 3.5, y: 1.4 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 0, to: 5, order: 1 },
			{ from: 1, to: 6, order: 1 },
			{ from: 1, to: 7, order: 1 },
			{ from: 2, to: 8, order: 1 },
			{ from: 2, to: 9, order: 1 },
			{ from: 2, to: 10, order: 1 }
		]
	},
	{
		formula: 'C6H6',
		name: 'Benzene',
		fact: 'A flat ring of six carbons. Found in gasoline. The classic aromatic shape!',
		atoms: [
			...ring(['C', 'C', 'C', 'C', 'C', 'C'], 0, 0, 2, -90),
			...ring(['H', 'H', 'H', 'H', 'H', 'H'], 0, 0, 3.5, -90)
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 2 },
			{ from: 3, to: 4, order: 1 },
			{ from: 4, to: 5, order: 2 },
			{ from: 5, to: 0, order: 1 },
			{ from: 0, to: 6, order: 1 },
			{ from: 1, to: 7, order: 1 },
			{ from: 2, to: 8, order: 1 },
			{ from: 3, to: 9, order: 1 },
			{ from: 4, to: 10, order: 1 },
			{ from: 5, to: 11, order: 1 }
		]
	},
	{
		formula: 'CH4N2O',
		name: 'Urea',
		fact: 'The main stuff in pee! Also used in fertilizer to help plants grow.',
		atoms: [
			{ el: 'C', x: 0, y: 0 },
			{ el: 'O', x: 0, y: -1.7 },
			{ el: 'N', x: -1.8, y: 0.9 },
			{ el: 'N', x: 1.8, y: 0.9 },
			{ el: 'H', x: -3.2, y: 0.4 },
			{ el: 'H', x: -1.5, y: 2.3 },
			{ el: 'H', x: 3.2, y: 0.4 },
			{ el: 'H', x: 1.5, y: 2.3 }
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 0, to: 2, order: 1 },
			{ from: 0, to: 3, order: 1 },
			{ from: 2, to: 4, order: 1 },
			{ from: 2, to: 5, order: 1 },
			{ from: 3, to: 6, order: 1 },
			{ from: 3, to: 7, order: 1 }
		]
	},
	{
		formula: 'NaHCO3',
		name: 'Baking Soda',
		fact: 'Makes cookies puff up! Sodium bicarbonate also fizzes with vinegar.',
		atoms: [
			{ el: 'Na', x: -3.6, y: 0 },
			{ el: 'O', x: -2, y: 0 },
			{ el: 'C', x: 0, y: 0 },
			{ el: 'O', x: 0, y: -1.7 },
			{ el: 'O', x: 1.5, y: 0.6 },
			{ el: 'H', x: 3, y: 0.3 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 2 },
			{ from: 2, to: 4, order: 1 },
			{ from: 4, to: 5, order: 1 }
		]
	},
	{
		formula: 'H2S',
		name: 'Hydrogen Sulfide',
		fact: 'The rotten-egg smell. Also what makes a stink bomb stink!',
		atoms: [
			{ el: 'S', x: 0, y: -0.5 },
			{ el: 'H', x: -2.2, y: 1.1 },
			{ el: 'H', x: 2.2, y: 1.1 }
		],
		bonds: [
			{ from: 0, to: 1, order: 1 },
			{ from: 0, to: 2, order: 1 }
		]
	},
	{
		formula: 'H2SO4',
		name: 'Sulfuric Acid',
		fact: 'The acid inside car batteries. One of the strongest acids around!',
		atoms: [
			{ el: 'S', x: 0, y: 0 },
			{ el: 'O', x: 0, y: -2 },
			{ el: 'O', x: 0, y: 2 },
			{ el: 'O', x: -2, y: 0 },
			{ el: 'O', x: 2, y: 0 },
			{ el: 'H', x: -3.5, y: 0 },
			{ el: 'H', x: 3.5, y: 0 }
		],
		bonds: [
			{ from: 0, to: 1, order: 2 },
			{ from: 0, to: 2, order: 2 },
			{ from: 0, to: 3, order: 1 },
			{ from: 0, to: 4, order: 1 },
			{ from: 3, to: 5, order: 1 },
			{ from: 4, to: 6, order: 1 }
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
	},
	{
		formula: 'C6H8O6',
		name: 'Vitamin C',
		fact: 'Found in oranges and lemons. Keeps your immune system strong!',
		atoms: [
			// 5-member lactone ring (pentagon, vertex up)
			{ el: 'C', x: 0, y: -1.8 },
			{ el: 'C', x: -1.71, y: -0.56 },
			{ el: 'C', x: -1.06, y: 1.46 },
			{ el: 'C', x: 1.06, y: 1.46 },
			{ el: 'O', x: 1.71, y: -0.56 },
			// Substituents
			{ el: 'O', x: 0, y: -3.3 }, // 5: =O on C1 (carbonyl)
			{ el: 'O', x: -3.2, y: -1 }, // 6: -OH on C2
			{ el: 'H', x: -3.7, y: -2.4 }, // 7
			{ el: 'O', x: -2.2, y: 2.9 }, // 8: -OH on C3
			{ el: 'H', x: -3.2, y: 3.8 }, // 9
			{ el: 'H', x: 1.4, y: 2.9 }, // 10: H on C4
			// Side chain: -CH(OH)-CH2OH off C4
			{ el: 'C', x: 2.56, y: 1.46 }, // 11: C5
			{ el: 'H', x: 2.56, y: 0 }, // 12: H on C5
			{ el: 'O', x: 2.56, y: 2.96 }, // 13: -OH on C5
			{ el: 'H', x: 3.5, y: 3.9 }, // 14
			{ el: 'C', x: 4.06, y: 1.46 }, // 15: C6
			{ el: 'H', x: 4.06, y: 0 }, // 16: H on C6
			{ el: 'H', x: 4.06, y: 2.96 }, // 17: H on C6
			{ el: 'O', x: 5.56, y: 1.46 }, // 18: -OH on C6
			{ el: 'H', x: 6.8, y: 1 } // 19
		],
		bonds: [
			// Ring
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 2 },
			{ from: 2, to: 3, order: 1 },
			{ from: 3, to: 4, order: 1 },
			{ from: 4, to: 0, order: 1 },
			// Substituents
			{ from: 0, to: 5, order: 2 },
			{ from: 1, to: 6, order: 1 },
			{ from: 6, to: 7, order: 1 },
			{ from: 2, to: 8, order: 1 },
			{ from: 8, to: 9, order: 1 },
			{ from: 3, to: 10, order: 1 },
			{ from: 3, to: 11, order: 1 },
			{ from: 11, to: 12, order: 1 },
			{ from: 11, to: 13, order: 1 },
			{ from: 13, to: 14, order: 1 },
			{ from: 11, to: 15, order: 1 },
			{ from: 15, to: 16, order: 1 },
			{ from: 15, to: 17, order: 1 },
			{ from: 15, to: 18, order: 1 },
			{ from: 18, to: 19, order: 1 }
		]
	},
	{
		formula: 'C9H8O4',
		name: 'Aspirin',
		fact: 'The headache medicine. Made from willow bark long ago.',
		atoms: [
			// Benzene ring (6 Cs, vertex up at top)
			...ring(['C', 'C', 'C', 'C', 'C', 'C'], 0, 0, 2, -90),
			// 6: C7 carboxyl C
			{ el: 'C', x: 0, y: -4 },
			// 7: =O on C7
			{ el: 'O', x: 1.3, y: -4.7 },
			// 8: -OH O on C7
			{ el: 'O', x: -1.3, y: -4.7 },
			// 9: H on the OH
			{ el: 'H', x: -2.4, y: -5.4 },
			// 10: ether O attached to C2 of ring (acetoxy)
			{ el: 'O', x: 3.23, y: -1 },
			// 11: acetyl carbonyl C
			{ el: 'C', x: 4.6, y: -1.7 },
			// 12: =O on acetyl C
			{ el: 'O', x: 5.0, y: -3.1 },
			// 13: methyl C
			{ el: 'C', x: 6.0, y: -0.9 },
			// 14-16: methyl Hs
			{ el: 'H', x: 7.2, y: -0.4 },
			{ el: 'H', x: 6.8, y: -2.2 },
			{ el: 'H', x: 5.7, y: 0.6 },
			// 17-20: aromatic Hs on C3, C4, C5, C6
			{ el: 'H', x: 3.2, y: 1.8 },
			{ el: 'H', x: 0, y: 3.5 },
			{ el: 'H', x: -3.2, y: 1.8 },
			{ el: 'H', x: -3.2, y: -1.8 }
		],
		bonds: [
			// Benzene ring (alternating Kekulé)
			{ from: 0, to: 1, order: 2 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 2 },
			{ from: 3, to: 4, order: 1 },
			{ from: 4, to: 5, order: 2 },
			{ from: 5, to: 0, order: 1 },
			// -COOH on C1
			{ from: 0, to: 6, order: 1 },
			{ from: 6, to: 7, order: 2 },
			{ from: 6, to: 8, order: 1 },
			{ from: 8, to: 9, order: 1 },
			// -O-CO-CH3 on C2
			{ from: 1, to: 10, order: 1 },
			{ from: 10, to: 11, order: 1 },
			{ from: 11, to: 12, order: 2 },
			{ from: 11, to: 13, order: 1 },
			{ from: 13, to: 14, order: 1 },
			{ from: 13, to: 15, order: 1 },
			{ from: 13, to: 16, order: 1 },
			// Aromatic Hs
			{ from: 2, to: 17, order: 1 },
			{ from: 3, to: 18, order: 1 },
			{ from: 4, to: 19, order: 1 },
			{ from: 5, to: 20, order: 1 }
		]
	},
	{
		formula: 'C8H10N4O2',
		name: 'Caffeine',
		fact: 'The molecule that wakes you up! In coffee, tea, and chocolate.',
		atoms: [
			// Pyrimidine ring (hexagon, C4/C5 shared with imidazole)
			{ el: 'N', x: -2.6, y: -0.75 }, // 0: N1
			{ el: 'C', x: -2.6, y: 0.75 }, // 1: C2
			{ el: 'N', x: -1.3, y: 1.5 }, // 2: N3
			{ el: 'C', x: 0, y: 0.75 }, // 3: C4 (shared)
			{ el: 'C', x: 0, y: -0.75 }, // 4: C5 (shared)
			{ el: 'C', x: -1.3, y: -1.5 }, // 5: C6
			// Imidazole ring
			{ el: 'N', x: 1.43, y: -1.21 }, // 6: N7
			{ el: 'C', x: 2.31, y: 0 }, // 7: C8
			{ el: 'N', x: 1.43, y: 1.21 }, // 8: N9
			// Carbonyls
			{ el: 'O', x: -3.9, y: 1.5 }, // 9: =O on C2
			{ el: 'O', x: -1.3, y: -3 }, // 10: =O on C6
			// Methyl on N1
			{ el: 'C', x: -3.9, y: -1.5 }, // 11: C_m1
			{ el: 'H', x: -5, y: -1 }, // 12
			{ el: 'H', x: -4.7, y: -2.6 }, // 13
			{ el: 'H', x: -5, y: -2 }, // 14
			// Methyl on N3
			{ el: 'C', x: -1.3, y: 3 }, // 15: C_m3
			{ el: 'H', x: -2.5, y: 3.6 }, // 16
			{ el: 'H', x: -0.1, y: 3.6 }, // 17
			{ el: 'H', x: -1.3, y: 4.5 }, // 18
			// Methyl on N7
			{ el: 'C', x: 1.9, y: -2.63 }, // 19: C_m7
			{ el: 'H', x: 1, y: -3.6 }, // 20
			{ el: 'H', x: 3, y: -3.5 }, // 21
			{ el: 'H', x: 2, y: -4.1 }, // 22
			// H on C8
			{ el: 'H', x: 3.81, y: 0 } // 23
		],
		bonds: [
			// Pyrimidine ring
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 1 },
			{ from: 3, to: 4, order: 2 },
			{ from: 4, to: 5, order: 1 },
			{ from: 5, to: 0, order: 1 },
			// Imidazole ring (C4-C5 shared, so 4 new bonds)
			{ from: 4, to: 6, order: 1 },
			{ from: 6, to: 7, order: 1 },
			{ from: 7, to: 8, order: 2 },
			{ from: 8, to: 3, order: 1 },
			// Carbonyls
			{ from: 1, to: 9, order: 2 },
			{ from: 5, to: 10, order: 2 },
			// Methyl on N1
			{ from: 0, to: 11, order: 1 },
			{ from: 11, to: 12, order: 1 },
			{ from: 11, to: 13, order: 1 },
			{ from: 11, to: 14, order: 1 },
			// Methyl on N3
			{ from: 2, to: 15, order: 1 },
			{ from: 15, to: 16, order: 1 },
			{ from: 15, to: 17, order: 1 },
			{ from: 15, to: 18, order: 1 },
			// Methyl on N7
			{ from: 6, to: 19, order: 1 },
			{ from: 19, to: 20, order: 1 },
			{ from: 19, to: 21, order: 1 },
			{ from: 19, to: 22, order: 1 },
			// H on C8
			{ from: 7, to: 23, order: 1 }
		]
	},
	{
		formula: 'C6H12O6',
		name: 'Glucose',
		fact: 'The simple sugar in fruit and honey. Your body burns it for energy.',
		atoms: [
			// 6-member ring with O (Haworth-style hexagon, vertex up)
			{ el: 'O', x: 0, y: -2 }, // 0: ring O
			{ el: 'C', x: 1.73, y: -1 }, // 1: C1
			{ el: 'C', x: 1.73, y: 1 }, // 2: C2
			{ el: 'C', x: 0, y: 2 }, // 3: C3
			{ el: 'C', x: -1.73, y: 1 }, // 4: C4
			{ el: 'C', x: -1.73, y: -1 }, // 5: C5
			// OH on C1
			{ el: 'O', x: 3.3, y: -1.5 }, // 6
			{ el: 'H', x: 4.4, y: -2.2 }, // 7
			{ el: 'H', x: 2.2, y: -2.4 }, // 8: H on C1
			// OH on C2
			{ el: 'O', x: 3.3, y: 1.5 }, // 9
			{ el: 'H', x: 4.4, y: 2.2 }, // 10
			{ el: 'H', x: 2.2, y: 2.4 }, // 11: H on C2
			// OH on C3
			{ el: 'O', x: -1.2, y: 3.5 }, // 12
			{ el: 'H', x: -1.8, y: 4.7 }, // 13
			{ el: 'H', x: 1.2, y: 3.3 }, // 14: H on C3
			// OH on C4
			{ el: 'O', x: -3.3, y: 1.5 }, // 15
			{ el: 'H', x: -4.4, y: 2.2 }, // 16
			{ el: 'H', x: -2.2, y: 2.4 }, // 17: H on C4
			// C5: just H + side chain
			{ el: 'H', x: -2.2, y: -2.4 }, // 18: H on C5
			{ el: 'C', x: -3.3, y: -1.5 }, // 19: C6 side chain
			{ el: 'H', x: -4.4, y: -0.8 }, // 20: H on C6
			{ el: 'H', x: -4.4, y: -2.4 }, // 21: H on C6
			{ el: 'O', x: -3.6, y: -3 }, // 22: OH on C6
			{ el: 'H', x: -2.6, y: -4 } // 23
		],
		bonds: [
			// Ring
			{ from: 0, to: 1, order: 1 },
			{ from: 1, to: 2, order: 1 },
			{ from: 2, to: 3, order: 1 },
			{ from: 3, to: 4, order: 1 },
			{ from: 4, to: 5, order: 1 },
			{ from: 5, to: 0, order: 1 },
			// C1: -OH, -H
			{ from: 1, to: 6, order: 1 },
			{ from: 6, to: 7, order: 1 },
			{ from: 1, to: 8, order: 1 },
			// C2: -OH, -H
			{ from: 2, to: 9, order: 1 },
			{ from: 9, to: 10, order: 1 },
			{ from: 2, to: 11, order: 1 },
			// C3: -OH, -H
			{ from: 3, to: 12, order: 1 },
			{ from: 12, to: 13, order: 1 },
			{ from: 3, to: 14, order: 1 },
			// C4: -OH, -H
			{ from: 4, to: 15, order: 1 },
			{ from: 15, to: 16, order: 1 },
			{ from: 4, to: 17, order: 1 },
			// C5: -H, -C6
			{ from: 5, to: 18, order: 1 },
			{ from: 5, to: 19, order: 1 },
			// C6: 2 H, -OH
			{ from: 19, to: 20, order: 1 },
			{ from: 19, to: 21, order: 1 },
			{ from: 19, to: 22, order: 1 },
			{ from: 22, to: 23, order: 1 }
		]
	}
];

export const MOLECULES: Molecule[] = defs.map((m) => ({
	...m,
	key: keyFor(m.atoms.map((a) => a.el))
}));

export const MOLECULE_BY_KEY: Record<string, Molecule> = Object.fromEntries(
	MOLECULES.map((m) => [m.key, m])
);
