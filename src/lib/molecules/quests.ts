import type { Quest } from './types';

export const QUESTS: Quest[] = [
	{
		id: 'water',
		prompt: 'Make water.',
		hint: 'Two hydrogens, one oxygen.',
		target: 'H2O'
	},
	{
		id: 'exhale',
		prompt: 'Make the gas we breathe out.',
		hint: 'A carbon between two oxygens.',
		target: 'CO2'
	},
	{
		id: 'salt',
		prompt: 'Make table salt.',
		hint: 'Sodium plus chlorine.',
		target: 'ClNa'
	},
	{
		id: 'methane',
		prompt: 'Make the gas that cows burp.',
		hint: 'One carbon with four hydrogens.',
		target: 'CH4'
	},
	{
		id: 'ammonia',
		prompt: 'Make ammonia (smells like cleaning spray).',
		hint: 'One nitrogen with three hydrogens.',
		target: 'H3N'
	},
	{
		id: 'rust',
		prompt: 'Make rust.',
		hint: 'Two irons, three oxygens.',
		target: 'Fe2O3'
	},
	{
		id: 'oxygen',
		prompt: 'Make the gas we breathe in.',
		hint: 'A pair of oxygens.',
		target: 'O2'
	},
	{
		id: 'ozone',
		prompt: 'Make the gas that shields us from sunburns.',
		hint: 'Three oxygens together.',
		target: 'O3'
	}
];
