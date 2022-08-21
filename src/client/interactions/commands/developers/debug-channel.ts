import { Client } from '@client';
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  channelMention,
} from 'discord.js';

export default {
  config: () => ({
    devOnly: true,
  }),
  data: new SlashCommandBuilder()
    .setName(String.get('debug_channel_command_name'))
    .setDescription(String.get('debug_channel_command_description'))
    .addChannelOption((channel) => channel
      .setName(String.get('debug_channel_command_channel_argument_name'))
      .setDescription(String.get('debug_channel_command_channel_argument_description'))
      .setRequired(true)),
  handler: async (interaction: ChatInputCommandInteraction) => {
    const channel = interaction.options.getChannel('channel', true);
    if (channel.type !== ChannelType.GuildText) return interaction.reply({ content: String.get('errors_argument_not_guild_text_channel', interaction.locale), ephemeral: true });

    (interaction.client as Client).setSettings('debugChannel', channel.id);

    interaction.reply({ content: String.get('debug_channel_command_set_success', interaction.locale, { keys: { CHANNEL: channelMention(channel.id) } }), ephemeral: true });
    return Promise.resolve();
  },
};
