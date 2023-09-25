import { Button } from "@interfaces";
import { info } from "@helpers/logger";
import { Client, Message, ButtonInteraction } from "@client";
import { MessageInteraction } from "discord.js";

export const button: Button = {
	buttonId: "deleteInteraction",
	async execute(client: Client, interaction: ButtonInteraction) {
		if (client.verbose) console.log(`${info}Interaction Message deleted!`);

		const messageInteraction: MessageInteraction = interaction.message
			.interaction as MessageInteraction;
		const message: Message = interaction.message as Message;

		if (messageInteraction != undefined && interaction.user.id != messageInteraction.user.id)
			return interaction.reply({
				content: interaction
					.strings()
					.Error.Interaction.Reserved.replace("%USER%", `<@!${messageInteraction.user.id}>`),
				ephemeral: true,
			});

		let fetchedRef: boolean = false;
		try {
			fetchedRef = (await message.fetchReference()).author.id != interaction.user.id;
		} catch {} // ref deleted or author not matching

		if (message.reference !== undefined && fetchedRef)
			return interaction.reply({
				content: interaction
					.strings()
					.Error.Interaction.Reserved.replace(
						"%USER%",
						`<@!${(await message.fetchReference()).author.id}>`,
					),
				ephemeral: true,
			});

		try {
			return message.delete();
		} catch (err) {
			return interaction.reply({
				content: interaction.strings().Error.Message.Deleted,
				ephemeral: true,
			});
		}
	},
};
