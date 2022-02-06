import { SlashCommand } from "@src/Interfaces/slashCommand";
import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction } from "@src/Client/interaction";
import MessageEmbed from "@src/Client/embed";
import Message from "@src/Client/message";
import { MessageAttachment } from "discord.js";
import { magnifyAttachment } from "@src/Functions/canvas/magnify";

export const command: SlashCommand = {
	permissions: undefined,
	data: new SlashCommandBuilder().setName("magnify").setDescription("Magnify an image"),
	execute: async (interaction: CommandInteraction) => {
		await interaction.deferReply();

		let imageURL: string = "";
		let isResponse: boolean = false;

		const messages = await interaction.channel.messages.fetch({ limit: 10 });
		let message = messages // get latest message with attachment
			.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
			.filter(
				(m) =>
					m.attachments.size > 0 ||
					(m.embeds[0] !== undefined && (m.embeds[0].thumbnail !== null || m.embeds[0].image !== null)),
			)
			.first();

		if (message === undefined) {
			const embed = new MessageEmbed()
				.setTitle("No images found")
				.setDescription(
					"No images were found in the 10 lasts messages, please submit one using a image url or attaching one to a new message, you can cancel this by sending anything else.",
				);

			interaction.editReply({ embeds: [embed] });

			const filter = (m) => m.author.id === interaction.member.user.id;
			const collected = await interaction.channel.awaitMessages({
				filter: filter,
				max: 1,
				time: 30000,
				errors: ["time"],
			});
			message = collected.first();

			isResponse = true;
		}

		if (message) {
			if (message.attachments.size > 0 && message.attachments.first().url.match(/\.(jpeg|jpg|png|webp)$/))
				imageURL = message.attachments.first().url;
			else if (message.embeds[0]) {
				if (message.embeds[0].image) imageURL = message.embeds[0].image.url;
				else if (message.embeds[0].thumbnail) imageURL = message.embeds[0].thumbnail.url;
			}

			if (isResponse) message.delete();
		}

		if (imageURL !== "" && message) {
			const embed = new MessageEmbed().setTitle(`Magnified`).setImage("attachment://magnified.png");

			const file: MessageAttachment = await magnifyAttachment(imageURL);
			if (file !== null) {
				interaction.editReply({ files: [file], embeds: [embed] }).then((message: Message) => message.deleteButton());
			} else {
				interaction.deleteReply();
				interaction.followUp({ content: "Output exeeds the maximum of 512 x 512px²!", ephemeral: true });
			}
		} else {
			interaction.deleteReply();
			interaction.followUp({ content: "No image were attached, nor valid URL were given!", ephemeral: true });
		}
	},
};
