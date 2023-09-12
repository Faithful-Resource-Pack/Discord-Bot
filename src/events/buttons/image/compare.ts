import { Button } from "@interfaces";
import { info } from "@helpers/logger";
import { Client, Message, ButtonInteraction, MessageEmbed } from "@client";
import textureComparison from "@functions/textureComparison";
import { InteractionEditReplyOptions, MessageEmbedFooter } from "discord.js";

export const button: Button = {
	buttonId: "compare",
	execute: async (client: Client, interaction: ButtonInteraction) => {
		if (client.verbose) console.log(`${info}Image was compared!`);

		const message: Message = interaction.message as Message;
		const ids = message.embeds?.[0]?.title.match(/\d+/);

		await interaction.deferReply();
		const messageOptions: InteractionEditReplyOptions = await textureComparison(client, ids[0]);

		(messageOptions.embeds[0] as MessageEmbed).setFooter(
			messageOptions.embeds[0].footer
				? {
						text: `${messageOptions.embeds[0].footer.text} | ${interaction.user.id}`,
						iconURL: (messageOptions.embeds[0].footer as MessageEmbedFooter).iconURL,
				  }
				: {
						text: interaction.user.id,
				  },
		);

		(messageOptions.embeds[0] as MessageEmbed).setTimestamp();

		return interaction.editReply(messageOptions).then((message: Message) => {
			message.deleteButton(true);
		});
	},
};
