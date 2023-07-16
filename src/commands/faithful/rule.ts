import { SlashCommand } from "@interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageEmbed, Client } from "@client";
import { colors } from "@helpers/colors";
import ruleStrings from "@json/rules.json";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("rule")
		.setDescription("Show the Faithful server rules.")
		.addStringOption((option) =>
			option
				.setName("number")
				.setDescription("Which rule to view")
				.addChoices(
					// using the value as an array index
					{ name: "1", value: "0" },
					{ name: "2", value: "1" },
					{ name: "3", value: "2" },
					{ name: "4", value: "3" },
					{ name: "5", value: "4" },
					{ name: "6", value: "5" },
					{ name: "7", value: "6" },
					{ name: "8", value: "7" },
					{ name: "9", value: "8" },
					{ name: "10", value: "9" },
					{ name: "all", value: "all" },
				)
				.setRequired(true),
		),
	execute: async (interaction: CommandInteraction) => {
		const choice = interaction.options.getString("number", true);

		if (choice == "all") {
			if (await interaction.perms({ type: "manager" })) return;

			interaction
				.reply({ content: "** **", fetchReply: true })
				.then((message: Message) => message.delete());

			// I hate this so much but there's not much I can do
			const thumbnail =
				interaction.guildId ==
				(interaction.client as Client).config.discords.find((obj) => obj.name == "classic_faithful")
					.id
					? `${
							(interaction.client as Client).config.images
					  }branding/logos/transparent/128/cf_plain_logo.png`
					: `${
							(interaction.client as Client).config.images
					  }branding/logos/transparent/128/plain_logo.png`;
			let embedArray = [];
			let i = 0;

			await interaction.channel.send({
				embeds: [
					new MessageEmbed()
						.setTitle(ruleStrings.rules_info.heading.title)
						.setDescription(ruleStrings.rules_info.heading.description)
						.setColor(colors.brand)
						.setThumbnail(thumbnail),
				],
			});

			for (let rule of ruleStrings.rules) {
				embedArray.push(
					new MessageEmbed()
						.setTitle(rule.title)
						.setDescription(rule.description)
						.setColor(colors.brand),
				);

				if ((i + 1) % 5 == 0) {
					await interaction.channel.send({ embeds: embedArray });
					embedArray = [];
				}
			}

			if (embedArray.length) await interaction.channel.send({ embeds: embedArray }); // sends the leftovers if exists
			const embedExpandedRules = new MessageEmbed()
				.setColor(colors.brand)
				.setTitle(ruleStrings.rules_info.expanded_rules.title)
				.setDescription(ruleStrings.rules_info.expanded_rules.description);

			let embedChanges: MessageEmbed; // needs to be declared outside the block to prevent block scope shenanigans

			if (ruleStrings.rules_info.changes.enabled) {
				// only for the changes note
				embedChanges = new MessageEmbed()
					.setTitle(ruleStrings.rules_info.changes.title)
					.setColor(colors.brand)
					.setDescription(ruleStrings.rules_info.changes.description)
					.setFooter({
						text: `The rules are subject to change at any time for any reason.`,
						iconURL: thumbnail,
					});
			}

			return await interaction.channel.send({ embeds: [embedExpandedRules, embedChanges] });
		}

		const ruleChoice = ruleStrings.rules[choice];
		return await interaction
			.reply({
				embeds: [
					new MessageEmbed()
						.setTitle(ruleChoice.title)
						.setDescription(ruleChoice.description)
						.setThumbnail(`${(interaction.client as Client).config.images}bot/rules.png`),
				],
				fetchReply: true,
			})
			.then((message: Message) => message.deleteButton());
	},
};
