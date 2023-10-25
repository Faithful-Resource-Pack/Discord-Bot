import { Client, Message, StringSelectMenuInteraction } from "@client";
import { Component } from "@interfaces";
import { info } from "@helpers/logger";
import { MessageInteraction } from "discord.js";
import { getTexture } from "@functions/getTexture";
import axios from "axios";

export default {
	id: "textureSelect",
	async execute(client: Client, interaction: StringSelectMenuInteraction) {
		if (client.verbose) console.log(`${info}Texture selected!`);

		const messageInteraction = interaction.message.interaction as MessageInteraction;
		const message = interaction.message as Message;

		if (interaction.user.id !== messageInteraction.user.id)
			return interaction.reply({
				content: interaction
					.strings()
					.error.interaction.reserved.replace("%USER%", `<@!${messageInteraction.user.id}>`),
				ephemeral: true,
			});

		interaction.deferUpdate();

		const [id, pack] = interaction.values[0].split("__");
		const editOptions = await getTexture(
			interaction,
			(await axios.get(`${interaction.client.tokens.apiUrl}textures/${id}/all`)).data,
			pack,
		);

		if (!editOptions.files) return await interaction.ephemeralReply(editOptions);

		return message.edit(editOptions).then((message: Message) => message.deleteButton());
	},
} as Component;
