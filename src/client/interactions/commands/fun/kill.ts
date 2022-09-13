import { ICommand } from '@interfaces';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from '@overrides';
import { userMention } from 'discord.js';

export default {
  config: () => ({
    ...JSON.configLoad('commands/kill.json'),
  }),
  data: new SlashCommandBuilder()
    .setNames(String.getAll('kill_command_name'))
    .setDescriptions(String.getAll('kill_command_description'))
    .addLocalizedUserOption(null, {
      names: String.getAll('kill_command_argument_user_name'),
      descriptions: String.getAll('kill_command_argument_user_description'),
    })
    .addLocalizedStringOption(null, {
      names: String.getAll('kill_command_argument_weapon_name'),
      descriptions: String.getAll('kill_command_argument_weapon_description'),
    }),
  handler: async (interaction: ChatInputCommandInteraction) => {
    const targetId = interaction.options.getUser(String.get('kill_command_argument_user_name'))?.id;
    const weapon = interaction.options.getString(String.get('kill_command_argument_weapon_name'));
    const keys: { PLAYER?: string, AUTHOR?: string, WEAPON?: string } = { AUTHOR: userMention(interaction.user.id) };
    const embed = new EmbedBuilder();

    if (targetId) {
      keys.PLAYER = userMention(targetId);

      if (weapon) {
        keys.WEAPON = weapon;

        const strings: Array<string> = String.get('kill_command_result_killed_by_using', interaction.guildLocale, { keys });
        embed.setDescription(strings[Math.floor(Math.random() * strings.length)]);
      } else {
        const strings: Array<string> = String.get('kill_command_result_killed_by', interaction.guildLocale, { keys });
        embed.setDescription(strings[Math.floor(Math.random() * strings.length)]);
      }
    } else {
      const strings: Array<string> = String.get('kill_command_result_killed', interaction.guildLocale, { keys });
      embed.setDescription(strings[Math.floor(Math.random() * strings.length)]);
    }

    interaction.replyDeletable({ embeds: [embed] });
  },
} as ICommand;
