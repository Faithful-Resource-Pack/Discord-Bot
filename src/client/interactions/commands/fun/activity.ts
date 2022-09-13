import axios from 'axios';
import {
  ChannelType,
  GuildMember,
  VoiceChannel,
} from 'discord.js';

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from '@overrides';
import { ICommand } from '@interfaces';
import { Client } from '@client';
import { Activities } from '@enums';
import { Logger } from '@utils';

export default {
  config: () => ({
    ...JSON.configLoad('commands/activity.json'),
  }),
  data: new SlashCommandBuilder()
    .setNames(String.getAll('activity_command_name'))
    .setDescriptions(String.getAll('activity_command_description'))
    .addLocalizedStringOption((option) => option
      .addChoices(...Object.keys(Activities)
        .map((name) => ({
          name: name.toLowerCase().replaceAll('_', ' '),
          value: Activities[name as keyof typeof Activities],
        })))
      .setRequired(true), {
      names: String.getAll('activity_command_option_activity_name'),
      descriptions: String.getAll('activity_command_option_activity_description'),
    })
    .addLocalizedChannelOption((option) => option
      .addChannelTypes(ChannelType.GuildVoice), {
      names: String.getAll('activity_command_option_channel_name'),
      descriptions: String.getAll('activity_command_option_channel_description'),
    }),
  handler: async (interaction: ChatInputCommandInteraction, client: Client) => {
    await interaction.deferReply();

    const { member } = interaction;
    const activity = interaction.options.getString(String.get('activity_command_option_activity_name'), true);
    let channel = interaction.options.getChannel(String.get('activity_command_option_channel_name')) as VoiceChannel;

    if (!channel) {
      const m = member as GuildMember;

      if (member && m.voice.channel && m.voice.channel.type === ChannelType.GuildVoice) {
        channel = m.voice.channel as VoiceChannel;
      } else {
        interaction.followUpDeletable({ content: String.get('activity_command_not_in_voice_channel', interaction.guild?.preferredLocale) });
        return;
      }
    }

    axios(`https://discord.com/api/v8/channels/${channel.id}/invites`, {
      data: JSON.stringify({
        max_age: 86400,
        max_uses: 0,
        target_application_id: activity,
        target_type: 2,
        temporary: false,
        validate: null,
      }),
      method: 'POST',
      headers: {
        Authorization: `Bot ${client.token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.data)
      .then((data) => {
        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
          .setURL(`https://discord.com/invite/${data.code}`)
          .setTitle(String.get('activity_command_invite_title', interaction.guild?.preferredLocale, {
            keys: {
              ACTIVITY: Object.keys(Activities)[Object.values(Activities).indexOf(activity as any)].toLowerCase().capitalize(),
            },
          }));

        interaction.followUpDeletable({ embeds: [embed] });
      })
      .catch((err) => {
        Logger.log('error', 'An error occurred while sending POST request to Discord API (activity)', err);
        interaction.followUpDeletable({ content: String.get('errors_slash_command_not_responding', interaction.guild?.preferredLocale) });
      });
  },
} as ICommand;
