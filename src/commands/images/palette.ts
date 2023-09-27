import { SlashCommand } from "@interfaces";
import { SlashCommandBuilder } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { generalSlashCommandImage } from "@functions/slashCommandImage";
import { EmbedBuilder } from "@client";
import { paletteAttachment } from "@images/palette";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("palette")
		.setDescription("Get the color palette of an image.")
		.addAttachmentOption((o) =>
			o.setName("image").setDescription("The image to palette").setRequired(false),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		generalSlashCommandImage(interaction, paletteAttachment, {
			factor: interaction.options.getNumber("factor"),
			name: "magnified.png",
			embed: new EmbedBuilder().setTitle("Magnified").setImage("attachment://magnified.png"),
			hideButtons: true,
		});
	},
};
