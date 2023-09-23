import { Button } from "@interfaces";
import { info } from "@helpers/logger";
import { Client, Message, ButtonInteraction, EmbedBuilder } from "@client";
import textureComparison from "@functions/textureComparison";
import { InteractionEditReplyOptions, EmbedFooterData } from "discord.js";

export const button: Button = {
	buttonId: "compare",
	execute: async (client: Client, interaction: ButtonInteraction) => {
		if (client.verbose) console.log(`${info}Image was compared!`);

		const message: Message = interaction.message as Message;
		const ids = message.embeds?.[0]?.title.match(/\d+/);

		await interaction.deferReply();
		const messageOptions: InteractionEditReplyOptions = await textureComparison(client, ids[0]);

		const embed = messageOptions.embeds[0] as EmbedBuilder;

		(messageOptions.embeds[0] as EmbedBuilder).setFooter(
			embed.data.footer
				? {
						text: `${embed.data.footer.text} | ${interaction.user.id}`,
						iconURL: embed.data.footer?.icon_url,
				  }
				: {
						text: interaction.user.id,
				  },
		);

		(messageOptions.embeds[0] as EmbedBuilder).setTimestamp();

		return interaction.editReply(messageOptions).then((message: Message) => {
			message.deleteButton(true);
		});
	},
};
