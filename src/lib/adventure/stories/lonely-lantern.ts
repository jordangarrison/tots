// "The Lonely Lantern" — a Rogers-tone adventure for toddlers.
//
// Authoring rubric (please read before adding or editing stories):
//   1. No winning, no losing. Every path is a good path.
//   2. There are helpers in every scene, even quiet ones.
//   3. Name at least one feeling per scene (use `feelingNote`).
//   4. Conflict, if any, is loneliness or fear or a misunderstanding —
//      and gets cared for, never defeated.
//   5. End at home, with a sentence that reflects what the child did.
//   6. Speak to the listener directly at least once. Rogers always did.
//
// Tokens for narration: {name}, {Title}, {they}/{them}/{their}/{theirs}/
// {themselves} and capitalized variants. See lib/adventure/types.ts.
// `flavor` lines are character-specific, so they hard-code names/pronouns.

import type { Story } from '../types';

export const lonelyLantern: Story = {
	id: 'lonely-lantern',
	title: 'The Lonely Lantern',
	startId: 'intro',
	restId: 'rest',
	scenes: {
		intro: {
			id: 'intro',
			art: { emoji: '🌙', background: '🏰' },
			narration: [
				'{Title} {name} was looking out the window.',
				'The sky was that soft purple color it gets when the day is almost asleep.',
				'In the trees at the edge of the woods, something was glowing — a tiny, flickery light. It blinked on. And off. And on again. Like it was trying to tell someone something.'
			],
			feelingNote:
				'{Name} felt curious. {They} also felt a little nervous. Both feelings can sit together — that\'s what feelings do.',
			flavor: {
				jane: 'Jane hummed quietly to herself — a song her grandmother had taught her.',
				isla: 'Just one star was out so far. Isla\'s favorite one. She nodded at it, like saying hello.',
				ollie: 'Ollie\'s ears went up. His tail thumped, just once, against the soft rug.'
			},
			choices: [{ label: 'Go and see who the light belongs to.', nextId: 'meet_lantern' }]
		},

		meet_lantern: {
			id: 'meet_lantern',
			art: { emoji: '🏮', background: '🌲🌿' },
			narration: [
				'In the dewy grass at the edge of the woods sat the smallest lantern {name} had ever seen.',
				'The little flame inside looked up. "Oh," said the lantern, in a tiny shaky voice. "Hello. I\'m — I\'m a little bit lost."',
				'The lantern\'s family lived deeper in the woods. They\'d been chasing fireflies and had wandered too far, and now the way back was all mixed up.'
			],
			feelingNote:
				'Being lost can feel scary. Even a little lantern, with their own light inside, can feel that way.',
			choices: [
				{ label: 'Ask the wind which way the family went.', nextId: 'wind_helper' },
				{ label: 'Share a snack with the rabbit watching from the ferns.', nextId: 'rabbit_helper' },
				{ label: 'Sit very still and listen for the old owl\'s song.', nextId: 'owl_helper' }
			]
		},

		wind_helper: {
			id: 'wind_helper',
			art: { emoji: '🍃', background: '🌬️🌲' },
			narration: [
				'{Name} called out softly, very politely: "Wind — please — have you seen a family of lanterns?"',
				'The wind didn\'t use words. But it lifted a few leaves and swirled them, gently, toward a path on the left.',
				'"Thank you, wind," said the lantern, their flame brightening just a little. {Name} and the lantern set off down the leafy path together.'
			],
			feelingNote:
				'Asking for help can feel hard. It is also a brave thing — maybe one of the bravest.',
			flavor: {
				jane: 'Wildflowers nodded as Jane passed, as if to say yes, yes, this way.',
				isla: 'More stars were coming out now. Isla counted them under her breath. Three. Four. Five.',
				ollie: 'Ollie put his nose to the wind and snuffled. He could smell something sweet — like home.'
			},
			choices: [{ label: 'Keep walking together.', nextId: 'lantern_scared' }]
		},

		rabbit_helper: {
			id: 'rabbit_helper',
			art: { emoji: '🐇', background: '🥕🌿' },
			narration: [
				'A small brown rabbit was watching from under a fern, looking very hungry and a little bit shy.',
				'{Name} unwrapped half of {their} snack and held it out, slowly — the way you do when something is shy.',
				'The rabbit nibbled, and nibbled, and then sat up tall. "I know where the lanterns live," the rabbit said. "I\'ll hop ahead. You follow."'
			],
			feelingNote:
				'Sharing what you have, especially when you don\'t have very much, is one of the kindest things a person can do.',
			flavor: {
				jane: 'Jane left a few crumbs at the base of the fern, in case any other small friends came by later.',
				isla: 'Isla noticed the rabbit\'s ears were a little crooked. She thought it made him look very wise.',
				ollie: 'Ollie wagged his tail slow and friendly, the way he did when he met someone new.'
			},
			choices: [{ label: 'Follow the rabbit.', nextId: 'lantern_scared' }]
		},

		owl_helper: {
			id: 'owl_helper',
			art: { emoji: '🦉', background: '🌲🌙' },
			narration: [
				'{Name} sat right down, and got very, very still.',
				'At first all {they} could hear was {their} own breathing. Then — far away — a slow, soft sound. Hoo. Hoo-hoo.',
				'The owl\'s song was coming from between two old pine trees. The lantern\'s flame steadied. "That way," they whispered.'
			],
			feelingNote:
				'Sometimes the most helpful thing we can do is stop, and listen. The world has a lot to tell us if we get quiet.',
			choices: [{ label: 'Walk toward the owl\'s song.', nextId: 'lantern_scared' }]
		},

		lantern_scared: {
			id: 'lantern_scared',
			art: { emoji: '🏮', background: '🌑🌲' },
			narration: [
				'After a while of walking, the lantern\'s flame got smaller. Almost a tiny dot.',
				'"What if we don\'t find them?" the lantern said. "What if I\'m lost forever?"'
			],
			feelingNote:
				'When we\'re tired and a little scared, our worries can feel very big. That happens to everyone — even grown-ups.',
			choices: [
				{ label: 'Hold the lantern close, very gently.', nextId: 'reunion' },
				{ label: 'Tell the lantern about a time you felt scared too.', nextId: 'reunion' },
				{ label: 'Hum a slow, quiet song together.', nextId: 'reunion' }
			]
		},

		reunion: {
			id: 'reunion',
			art: { emoji: '🏮', background: '🏮✨🏮' },
			narration: [
				'Just then, between the trees, lots of small lights began to glow. One. Two. A whole soft circle of them.',
				'"There you are!" said the lanterns. "We\'ve been looking everywhere." They wrapped around the little one in a warm, glowing hug.',
				'The little lantern\'s flame grew tall and steady and bright. They turned to {name}. "Thank you for staying with me. I wasn\'t alone."'
			],
			feelingNote:
				'Being there for someone — even just sitting next to them while they\'re scared — is one of the biggest kindnesses there is.',
			choices: [{ label: 'Wave goodbye and head home.', nextId: 'home' }]
		},

		home: {
			id: 'home',
			kind: 'ending',
			art: { emoji: '☕', background: '🏰🛏️' },
			narration: [
				'Back at the castle, there was a mug of cocoa waiting, and a soft blanket, and the kind of quiet that means you\'re safe.',
				'{Name} curled up. Outside, far in the woods, a tiny light flickered — twice — like a wave goodnight.',
				'And here, the storyteller looked at the listener: You helped the lantern get home tonight. That was a kind, brave thing. Sleep well.'
			],
			choices: [{ label: 'Tell it again. ✨', nextId: 'intro' }]
		},

		rest: {
			id: 'rest',
			kind: 'rest',
			art: { emoji: '🪟', background: '🌙✨' },
			narration: [
				'Sometimes a story is a lot of feelings all at once. That\'s okay.',
				'We can sit here at the window for as long as we like. The castle is quiet. The blanket is warm.',
				'When you\'re ready, we can keep going. Or we can be done for tonight. Both are good choices.'
			],
			choices: []
		}
	}
};
