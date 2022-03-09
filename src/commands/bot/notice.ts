import { SlashCommand } from "@interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Client, MessageEmbed } from "@client";
import { readFileSync } from "fs";
import path from "path";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setDefaultPermission(true)
		.setName("notice")
		.setDescription("Gets the latest and greatest news about the bot"),
	execute: async (interaction: CommandInteraction, client: Client) => {
		const noticeJson = JSON.parse(readFileSync(path.join(__dirname, "../../../json/notice.json"), "utf-8"));

		const embed = new MessageEmbed()
			.setTitle(noticeJson.title)
			.setDescription(noticeJson.description.join("\n"))
			.setTimestamp(noticeJson.unix);
		interaction.reply({ embeds: [embed] });
	},
};
