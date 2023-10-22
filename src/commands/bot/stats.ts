import { SlashCommand, SlashCommandI } from "@interfaces";
import { SlashCommandBuilder, Collection, Guild, version as djsVersion } from "discord.js";
import { Client, EmbedBuilder, ChatInputCommandInteraction, Message } from "@client";
import os from "os";
import linuxOs from "linux-os-info";
import axios from "axios";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Gets statistics about the bot or commands.")
		.addSubcommand((subcommand) =>
			subcommand.setName("bot").setDescription("Statistics about the bot."),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("command")
				.setDescription("Returns top 10 most used commands.")
				.addStringOption((option) =>
					option
						.setName("command")
						.setDescription("Returns usage for a specific command.")
						.setRequired(false),
				),
		),
	execute: new Collection<string, SlashCommandI>()
		.set("bot", async (interaction: ChatInputCommandInteraction) => {
			// easier to get extended properties
			const client = interaction.client;
			let sumMembers = 0;
			let version: string;

			client.guilds.cache.each((guild: Guild) => {
				sumMembers += guild.memberCount;
			});

			const number = [...client.commandsProcessed.values()].reduce((a, b) => a + b, 0) + 1;

			if (os.platform() == "linux") version = linuxOs({ mode: "sync" }).pretty_name;
			else version = os.version();

			const image: string = (await axios.get(`${client.tokens.apiUrl}settings/images.heart`)).data;

			const embed = new EmbedBuilder()
				.setTitle(`${client.user.username}'s Statistics`)
				.setThumbnail(client.user.displayAvatarURL())
				.addFields(
					{ name: "Prefix", value: interaction.client.tokens.prefix, inline: true },
					{
						name: "Uptime",
						value: `<t:${Math.round((new Date().getTime() - client.uptime) / 1000)}:R>`,
						inline: true,
					},
					{ name: "Server Count", value: client.guilds.cache.size.toString(), inline: true },
					{
						name: "Memory Usage",
						value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
						inline: true,
					},
					{ name: "Discord Library", value: `Discord.js ${djsVersion}`, inline: true },
					{ name: "Node.js", value: `${process.version}`, inline: true },
					{ name: "Total Commands", value: `${client.slashCommands.size}`, inline: true },
					{ name: "Commands Processed", value: `${number}`, inline: true },
					{ name: "Members Across Servers", value: `${sumMembers}`, inline: true },
					{ name: "Operating System", value: version },
				)
				.setFooter({
					text: "Made with love",
					iconURL: image,
				});
			interaction
				.reply({ embeds: [embed], fetchReply: true })
				.then((message: Message) => message.deleteButton());
		})
		.set("command", async (interaction: ChatInputCommandInteraction) => {
			//if the command args are provided and the command does not exist in commandsProcessed:
			if (
				interaction.options.getString("command") &&
				interaction.client.commandsProcessed.get(interaction.options.getString("command")) ===
					undefined
			)
				return interaction.reply({
					ephemeral: true,
					content: interaction
						.strings()
						.command.stats.not_found.replace("%COMMAND%", interaction.options.getString("command")),
				});

			if (interaction.options.getString("command")) {
				const embed = new EmbedBuilder().setTimestamp().setTitle(
					interaction
						.strings()
						.command.stats.usage.replace("%COMMAND%", interaction.options.getString("command"))
						.replace(
							"%USE%",
							interaction.client.commandsProcessed
								.get(interaction.options.getString("command"))
								.toString() ?? "0",
						),
				);
				interaction.reply({ ephemeral: true, embeds: [embed] });
			} else {
				//sorts commands by usage: 4,3,2,1
				const sorted = new Map(
					[...interaction.client.commandsProcessed.entries()].sort((a, b) => b[1] - a[1]),
				);
				const data = [[...sorted.keys()], [...sorted.values()]];

				const embed = new EmbedBuilder()
					.setTimestamp()
					.setTitle(interaction.strings().command.stats.top_ten).setDescription(`
${data[0]
	.slice(0, data[0].length > 10 ? 10 : data[0].length)
	.map((key: any, index: any) => {
		let place = `\`${index + 1 < 10 ? ` ${index + 1}` : index + 1}.`;
		place += ` `.repeat(4 - place.length);
		place += "`";
		let command = `\`${key}`;
		command += ` `.repeat(13 - command.length);
		command += "`";
		let uses = `\`${data[1][index]}`;
		uses += "`";

		return `${place} ${command} - ${uses}`;
	})
	.join("\n")}`);

				interaction.reply({ ephemeral: true, embeds: [embed] });
			}
		}),
};
