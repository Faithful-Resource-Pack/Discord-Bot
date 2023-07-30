import axios from "axios";
import { CommandInteraction, Client, Message } from "@client";

export default async function parseTextureName(
	name: string,
	interaction: CommandInteraction,
): Promise<any[]> {
	name = name.toLowerCase().trim().replace(".png", "").replace("#", "").replace(/ /g, "_");

	if (name.length < 3) {
		interaction
			.editReply({
				content: "You need at least three characters to start a texture search!",
			})
			.then((message: Message) => message.deleteButton());
		return;
	}

	let results: any;
	try {
		results = (
			await axios.get(`${(interaction.client as Client).tokens.apiUrl}textures/${name}/all`)
		).data;
	} catch {
		return [];
	}

	// if you search by texture id it returns a single object, so you need to cast to an array
	return !isNaN(Number(name)) ? [results] : results;
}
