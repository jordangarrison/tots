import type { Story } from '../types';
import { lonelyLantern } from './lonely-lantern';

export const stories: Story[] = [lonelyLantern];

export function getStory(id: string): Story | undefined {
	return stories.find((s) => s.id === id);
}
