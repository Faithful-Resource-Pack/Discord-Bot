import { SlashCommand } from "@src/Interfaces/slashCommand";
import { SlashCommandBuilder, SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed, Message } from "@src/Extended Discord";

export const command: SlashCommand = {
	permissions: undefined,
	data: new SlashCommandBuilder()
		.setName("ball")
		.setDescription("Asks a question to the 8-ball.")
		.addStringOption((option: SlashCommandStringOption) =>
			option.setName("question").setDescription("The question to ask to the 8-ball.").setRequired(true),
		),
	execute: async (interaction: CommandInteraction) => {
		const answers = (await interaction.text({ string: "Command.EightBall.Answers" })).split("$,");

		let embed = new MessageEmbed()
			.setTitle(`${interaction.options.getString("question", true)}`.slice(0, 255))
			.setDescription(answers[Math.floor(Math.random() * answers.length)]);

		if (interaction.options.getString("question") == "balls") embed.setDescription("lol");
		else if (interaction.options.getString("question").includes("sentient")) embed.setDescription("Yes.");
		else if (interaction.options.getString("question") == "bitches?") embed.setDescription("no bitches.");

		interaction.reply({ embeds: [embed], fetchReply: true }).then((message: Message) => message.deleteButton());
	},
};
