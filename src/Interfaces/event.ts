import Client from '@src/Client';
import { ClientEvents } from 'discord.js';

interface CustomEvents extends ClientEvents {
	slashCommandUsed: any;
	buttonUsed: any;
	selectMenuUsed: any;
}

interface Run {
	(client: Client, ...args: any[]);
}

export interface Event {
	name: keyof CustomEvents;
	run: Run;
}
