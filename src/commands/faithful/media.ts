import { SlashCommand } from "@interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import { media } from "@helpers/infoembed";
import { Message, EmbedBuilder, ChatInputCommandInteraction } from "@client";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("media")
		.setDescription("Displays all sites for the given resource pack.")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the resource pack you want to see the sites of.")
				.addChoices(
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x Jappa", value: "classic_faithful_32x" },
					{ name: "Classic Faithful 32x Programmer Art", value: "classic_faithful_32x_progart" },
					{ name: "Classic Faithful 64x", value: "classic_faithful_64x" },
					{ name: "All", value: "all" },
				),
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const key: string = interaction.options.getString("name", false) ?? "general";

		if (key === "all") {
			if (!interaction.hasPermission("manager")) return;
			interaction
				.reply({ content: "** **", fetchReply: true })
				.then((message: Message) => message.delete());

			return await interaction.channel.send({
				embeds: Object.values(media).map((mediaInfo) =>
					new EmbedBuilder()
						.setTitle(mediaInfo.title)
						.setDescription(mediaInfo.description)
						.setColor(mediaInfo.color)
						.setThumbnail(mediaInfo.thumbnail),
				),
			});
		}

		const embed = new EmbedBuilder()
			.setTitle(media[key].title)
			.setDescription(media[key].description)
			.setColor(media[key].color)
			.setThumbnail(media[key].thumbnail);

		interaction
			.reply({ embeds: [embed], fetchReply: true })
			.then((message: Message) => message.deleteButton());
	},
};
