// Kid-friendly lesson plan.
//
// Pedagogy notes baked in (from typing-pedagogy research + Mavis Beacon style):
//   • Start at the HOME ROW with F and J — the keys with the bumps you can feel.
//   • Add one or two new keys at a time, then mix them with the keys already known.
//   • Build short single-key drills first; promote to real words once a few
//     home-row letters are known.
//   • Move home row → top row → bottom row → space → simple word mixes.
//   • Every drill stays SHORT (kid attention span) and only uses keys the
//     learner has already met. No surprise keys.
//
// The actual game is forgiving: wrong keys never penalize, the cursor just
// waits for the right one. Stars are awarded by accuracy, but finishing
// always earns at least one star.

import type { Lesson } from './types';

export const LESSONS: Lesson[] = [
	{
		id: 'home-fj',
		title: 'Bumpy Keys',
		description: 'Meet F and J — the keys with the little bumps!',
		emoji: '🟢',
		tier: 'home',
		newKeys: ['f', 'j'],
		reviewKeys: [],
		drills: [
			{ kind: 'keys', content: 'f f f f f', hint: 'Left pointer finger — feel the bump on F!' },
			{ kind: 'keys', content: 'j j j j j', hint: 'Right pointer finger — feel the bump on J!' },
			{ kind: 'keys', content: 'f j f j f j', hint: 'Bounce back and forth.' },
			{ kind: 'keys', content: 'fj jf fj jf' }
		]
	},
	{
		id: 'home-dk',
		title: 'Middle Magic',
		description: 'Add D and K with your middle fingers.',
		emoji: '🪄',
		tier: 'home',
		newKeys: ['d', 'k'],
		reviewKeys: ['f', 'j'],
		drills: [
			{ kind: 'keys', content: 'd d d d d', hint: 'Left middle finger.' },
			{ kind: 'keys', content: 'k k k k k', hint: 'Right middle finger.' },
			{ kind: 'keys', content: 'd k d k d k' },
			{ kind: 'keys', content: 'fd jk fd jk' }
		]
	},
	{
		id: 'home-sl',
		title: 'Ring Rings',
		description: 'Ring fingers stretch to S and L.',
		emoji: '💍',
		tier: 'home',
		newKeys: ['s', 'l'],
		reviewKeys: ['f', 'j', 'd', 'k'],
		drills: [
			{ kind: 'keys', content: 's s s s s', hint: 'Left ring finger.' },
			{ kind: 'keys', content: 'l l l l l', hint: 'Right ring finger.' },
			{ kind: 'keys', content: 'sl sl sl sl' },
			{
				kind: 'keys',
				content: 'asdf jkl;'.replace(/[a;]/g, '').trim().split('').join(' '),
				hint: 'All the ring + middle + index keys.'
			}
		]
	},
	{
		id: 'home-a-semi',
		title: 'Pinky Power',
		description: 'Tiny pinkies reach for A and ;.',
		emoji: '🤏',
		tier: 'home',
		newKeys: ['a', ';'],
		reviewKeys: ['s', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'a a a a a', hint: 'Left pinky — tiny but mighty.' },
			{ kind: 'keys', content: '; ; ; ; ;', hint: 'Right pinky.' },
			{ kind: 'keys', content: 'a s d f j k l ;', hint: 'The whole home row!' }
		]
	},
	{
		id: 'home-gh',
		title: 'Reach for G & H',
		description: 'Pointer fingers stretch one key in.',
		emoji: '🫳',
		tier: 'home',
		newKeys: ['g', 'h'],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
		drills: [
			{ kind: 'keys', content: 'g g g g g', hint: 'Left pointer slides over to G.' },
			{ kind: 'keys', content: 'h h h h h', hint: 'Right pointer slides over to H.' },
			{ kind: 'keys', content: 'fg jh fg jh' },
			{ kind: 'keys', content: 'a s d f g h j k l ;', hint: 'You can type the whole home row now!' }
		]
	},
	{
		id: 'home-words',
		title: 'Home Row Words',
		description: 'Tiny words made from your home-row friends.',
		emoji: '⭐',
		tier: 'words',
		newKeys: [],
		reviewKeys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
		drills: [
			{ kind: 'words', content: 'ask sad lad has', hint: 'Press space between words!' },
			{ kind: 'words', content: 'fall hall glad flask' },
			{ kind: 'words', content: 'dad lass half jaff' }
		]
	},
	{
		id: 'top-ei',
		title: 'Top Row: E & I',
		description: 'Middle fingers reach UP for E and I.',
		emoji: '⬆️',
		tier: 'top',
		newKeys: ['e', 'i'],
		reviewKeys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'e e e e e', hint: 'Left middle finger UP.' },
			{ kind: 'keys', content: 'i i i i i', hint: 'Right middle finger UP.' },
			{ kind: 'keys', content: 'ed ki ed ki' },
			{ kind: 'words', content: 'red kid she like' }
		]
	},
	{
		id: 'top-ru',
		title: 'Top Row: R & U',
		description: 'Pointer fingers stretch up.',
		emoji: '🚀',
		tier: 'top',
		newKeys: ['r', 'u'],
		reviewKeys: ['e', 'i', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'r r r r r', hint: 'Left pointer reaches up to R.' },
			{ kind: 'keys', content: 'u u u u u', hint: 'Right pointer reaches up to U.' },
			{ kind: 'words', content: 'sure fish hair ride' }
		]
	},
	{
		id: 'top-wo',
		title: 'Top Row: W & O',
		description: 'Ring fingers wave hello to W and O.',
		emoji: '🌊',
		tier: 'top',
		newKeys: ['w', 'o'],
		reviewKeys: ['r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'w w w w w', hint: 'Left ring finger UP.' },
			{ kind: 'keys', content: 'o o o o o', hint: 'Right ring finger UP.' },
			{ kind: 'words', content: 'wow look were word' }
		]
	},
	{
		id: 'top-qp',
		title: 'Top Row: Q & P',
		description: 'Pinkies climb to Q and P.',
		emoji: '👑',
		tier: 'top',
		newKeys: ['q', 'p'],
		reviewKeys: ['w', 'o', 'r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'q q q q q', hint: 'Left pinky UP.' },
			{ kind: 'keys', content: 'p p p p p', hint: 'Right pinky UP.' },
			{ kind: 'words', content: 'quiet paper pop pup' }
		]
	},
	{
		id: 'top-ty',
		title: 'Top Row: T & Y',
		description: 'The last two top-row keys!',
		emoji: '🎉',
		tier: 'top',
		newKeys: ['t', 'y'],
		reviewKeys: ['q', 'p', 'w', 'o', 'r', 'u', 'e', 'i', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 't t t t t', hint: 'Left pointer leans over to T.' },
			{ kind: 'keys', content: 'y y y y y', hint: 'Right pointer leans over to Y.' },
			{ kind: 'words', content: 'try yes typed yarn' }
		]
	},
	{
		id: 'bottom-vm',
		title: 'Bottom Row: V & M',
		description: 'Pointers reach DOWN.',
		emoji: '⬇️',
		tier: 'bottom',
		newKeys: ['v', 'm'],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o', 'r', 'u'],
		drills: [
			{ kind: 'keys', content: 'v v v v v', hint: 'Left pointer reaches DOWN to V.' },
			{ kind: 'keys', content: 'm m m m m', hint: 'Right pointer reaches DOWN to M.' },
			{ kind: 'words', content: 'move five mom van' }
		]
	},
	{
		id: 'bottom-cn',
		title: 'Bottom Row: C & N',
		description: 'Middle and pointer dip down.',
		emoji: '🌙',
		tier: 'bottom',
		newKeys: ['c', 'n'],
		reviewKeys: ['v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o'],
		drills: [
			{ kind: 'keys', content: 'c c c c c', hint: 'Left middle DOWN to C.' },
			{ kind: 'keys', content: 'n n n n n', hint: 'Right pointer DOWN to N.' },
			{ kind: 'words', content: 'cat nice can fun' }
		]
	},
	{
		id: 'bottom-xb',
		title: 'Bottom Row: X & B',
		description: 'Ring + pointer go low.',
		emoji: '🦕',
		tier: 'bottom',
		newKeys: ['x', 'b'],
		reviewKeys: ['c', 'n', 'v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'x x x x x', hint: 'Left ring DOWN to X.' },
			{ kind: 'keys', content: 'b b b b b', hint: 'Left pointer DOWN to B.' },
			{ kind: 'words', content: 'box bake fix bus' }
		]
	},
	{
		id: 'bottom-z',
		title: 'Bottom Row: Z & /',
		description: 'Sleepy pinkies head DOWN.',
		emoji: '😴',
		tier: 'bottom',
		newKeys: ['z', '/'],
		reviewKeys: ['x', 'b', 'c', 'n', 'v', 'm', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'z z z z z', hint: 'Left pinky DOWN to Z.' },
			{ kind: 'keys', content: '/ / / / /', hint: 'Right pinky DOWN to the slash.' },
			{ kind: 'words', content: 'zip zone size buzz' }
		]
	},
	{
		id: 'space-words',
		title: 'Thumbs & Space',
		description: 'Thumbs press the long SPACE bar.',
		emoji: '👍',
		tier: 'space',
		newKeys: [' '],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'e', 'i', 'o', 't', 'h', 'n', 'r'],
		drills: [
			{
				kind: 'words',
				content: 'the and cat dog',
				hint: 'Tap SPACE with a thumb after each word.'
			},
			{ kind: 'words', content: 'i like cats and dogs' },
			{ kind: 'words', content: 'this is so fun to do' }
		]
	},
	{
		id: 'sentences',
		title: 'Tiny Sentences',
		description: 'Put it all together!',
		emoji: '🏆',
		tier: 'words',
		newKeys: [],
		reviewKeys: [
			'a',
			's',
			'd',
			'f',
			'g',
			'h',
			'j',
			'k',
			'l',
			'q',
			'w',
			'e',
			'r',
			't',
			'y',
			'u',
			'i',
			'o',
			'p',
			'z',
			'x',
			'c',
			'v',
			'b',
			'n',
			'm',
			' '
		],
		drills: [
			{ kind: 'words', content: 'a cat and a dog' },
			{ kind: 'words', content: 'i can type a lot' },
			{ kind: 'words', content: 'the quick fox jumps' }
		]
	},

	// ---------------------------------------------------------------------
	// ADVANCED: Number row. Same fingers as the letters below, reaching UP.
	// ---------------------------------------------------------------------
	{
		id: 'numbers-1-5',
		title: 'Numbers 1–5',
		description: 'Left hand reaches to the number row.',
		emoji: '5️⃣',
		tier: 'numbers',
		newKeys: ['1', '2', '3', '4', '5'],
		reviewKeys: [],
		drills: [
			{ kind: 'keys', content: '1 1 1 1 1', hint: 'Left pinky UP UP to 1.' },
			{ kind: 'keys', content: '2 2 2 2 2', hint: 'Left ring finger to 2.' },
			{ kind: 'keys', content: '3 3 3 3 3', hint: 'Left middle finger to 3.' },
			{ kind: 'keys', content: '4 4 4 4 4', hint: 'Left pointer to 4.' },
			{ kind: 'keys', content: '5 5 5 5 5', hint: 'Left pointer stretches to 5.' },
			{ kind: 'keys', content: '1 2 3 4 5' }
		]
	},
	{
		id: 'numbers-6-0',
		title: 'Numbers 6–0',
		description: 'Right hand reaches to the number row.',
		emoji: '🔟',
		tier: 'numbers',
		newKeys: ['6', '7', '8', '9', '0'],
		reviewKeys: ['1', '2', '3', '4', '5'],
		drills: [
			{ kind: 'keys', content: '6 6 6 6 6', hint: 'Right pointer stretches to 6.' },
			{ kind: 'keys', content: '7 7 7 7 7', hint: 'Right pointer to 7.' },
			{ kind: 'keys', content: '8 8 8 8 8', hint: 'Right middle finger to 8.' },
			{ kind: 'keys', content: '9 9 9 9 9', hint: 'Right ring finger to 9.' },
			{ kind: 'keys', content: '0 0 0 0 0', hint: 'Right pinky to 0.' },
			{ kind: 'keys', content: '6 7 8 9 0' }
		]
	},
	{
		id: 'numbers-mix',
		title: 'Counting Mix',
		description: 'Use both hands to type numbers.',
		emoji: '🔢',
		tier: 'numbers',
		newKeys: [],
		reviewKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		drills: [
			{ kind: 'words', content: '1 2 3 4 5 6 7 8 9 10' },
			{ kind: 'words', content: '10 9 8 7 6 5 4 3 2 1', hint: 'Counting down!' },
			{ kind: 'words', content: '24 7 365 100' }
		]
	},

	// ---------------------------------------------------------------------
	// ADVANCED: Capital letters. The OPPOSITE-hand pinky presses Shift while
	// the typing finger presses the letter. UI highlights both fingers + the
	// matching Shift key.
	// ---------------------------------------------------------------------
	{
		id: 'caps-left',
		title: 'BIG Letters (Left)',
		description: 'Right pinky holds Shift while left hand types.',
		emoji: '🔠',
		tier: 'caps',
		newKeys: ['A', 'S', 'D', 'F'],
		reviewKeys: ['a', 's', 'd', 'f'],
		drills: [
			{ kind: 'keys', content: 'A A A A', hint: 'Right pinky holds ⇧ — left pinky taps A.' },
			{ kind: 'keys', content: 'S S S S' },
			{ kind: 'keys', content: 'D D D D' },
			{ kind: 'keys', content: 'F F F F' },
			{ kind: 'words', content: 'Ada Sam Dad Fad', hint: 'Capital first, then lowercase.' }
		]
	},
	{
		id: 'caps-right',
		title: 'BIG Letters (Right)',
		description: 'Left pinky holds Shift while right hand types.',
		emoji: '🅰️',
		tier: 'caps',
		newKeys: ['J', 'K', 'L'],
		reviewKeys: ['A', 'S', 'D', 'F', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: 'J J J J', hint: 'Left pinky holds ⇧ — right pointer taps J.' },
			{ kind: 'keys', content: 'K K K K' },
			{ kind: 'keys', content: 'L L L L' },
			{ kind: 'words', content: 'Jack Kim Lou' }
		]
	},
	{
		id: 'caps-names',
		title: 'BIG Names',
		description: 'Type names that start with a Capital.',
		emoji: '🪪',
		tier: 'caps',
		newKeys: [],
		reviewKeys: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
		drills: [
			{ kind: 'words', content: 'Ada Bob Cat Dog' },
			{ kind: 'words', content: 'Isla Jane Ollie' },
			{ kind: 'words', content: 'I am Sam' }
		]
	},

	// ---------------------------------------------------------------------
	// ADVANCED: Punctuation. Mix of unshifted (.,/') and shifted (?!:").
	// ---------------------------------------------------------------------
	{
		id: 'punct-easy',
		title: 'Dots & Commas',
		description: 'The . and , keys (no Shift needed).',
		emoji: '🔵',
		tier: 'punctuation',
		newKeys: ['.', ','],
		reviewKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: '. . . . .', hint: 'Right ring finger.' },
			{ kind: 'keys', content: ', , , , ,', hint: 'Right middle finger.' },
			{ kind: 'words', content: 'a, b, c.' },
			{ kind: 'words', content: 'i like cats, dogs, and fish.' }
		]
	},
	{
		id: 'punct-question',
		title: 'Question Marks?',
		description: 'Press ⇧ + / for a question mark.',
		emoji: '❓',
		tier: 'punctuation',
		newKeys: ['?'],
		reviewKeys: ['.', ',', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: '? ? ? ? ?', hint: 'Left pinky holds ⇧, right pinky taps /.' },
			{ kind: 'words', content: 'who? me?' },
			{ kind: 'words', content: 'cat? dog? fish?' }
		]
	},
	{
		id: 'punct-bang',
		title: 'Excited!',
		description: 'Press ⇧ + 1 for an exclamation point.',
		emoji: '❗',
		tier: 'punctuation',
		newKeys: ['!'],
		reviewKeys: ['?', '.', ',', '1'],
		drills: [
			{ kind: 'keys', content: '! ! ! ! !', hint: 'Right pinky holds ⇧, left pinky taps 1.' },
			{ kind: 'words', content: 'yes! wow! cool!' },
			{ kind: 'words', content: 'go cat go!' }
		]
	},
	{
		id: 'punct-apos',
		title: 'Apostrophes',
		description: "It's the ' key, right pinky.",
		emoji: '🪶',
		tier: 'punctuation',
		newKeys: ["'"],
		reviewKeys: ['.', ',', '?', 'a', 's', 'd', 'f', 'j', 'k', 'l'],
		drills: [
			{ kind: 'keys', content: "' ' ' ' '", hint: 'Right pinky, next to semicolon.' },
			{ kind: 'words', content: "it's dad's cat's" },
			{ kind: 'words', content: "i'm ok. it's fine." }
		]
	}
];

export function findLesson(id: string): Lesson | undefined {
	return LESSONS.find((l) => l.id === id);
}

export function lessonIndex(id: string): number {
	return LESSONS.findIndex((l) => l.id === id);
}

export function nextLessonId(id: string): string | undefined {
	const i = lessonIndex(id);
	if (i < 0) return undefined;
	return LESSONS[i + 1]?.id;
}
