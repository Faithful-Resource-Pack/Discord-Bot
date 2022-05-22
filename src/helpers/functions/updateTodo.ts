import { Client, MessageEmbed } from '@client';
import axios from 'axios';
import { CommandInteraction, TextChannel } from 'discord.js';

export default async function updateTodo(guildID: string, client: Client, json, interaction: CommandInteraction): Promise<void> {
  let description = '';

  const channel: TextChannel = client.channels.cache.get(
    client.config.discords.filter((d) => d.id === guildID)[0].channels.todo,
  ) as TextChannel;

  channel.bulkDelete(10); // assuming no more than 10 messages will be present

  for (const category in json[guildID]) {
    if (json[guildID].hasOwnProperty(category)) {
      const c = json[guildID][category];
      description += `\n**${category.toUpperCase()}**\n`;

      for (const entry in c) {
        if (c.hasOwnProperty(entry)) {
          if (c[entry].reason) description += `**${entry}** - *${c[entry].reason}*\n`;

          if (c[entry].children) {
            for (const child in c[entry].children) {
              if (c[entry].children.hasOwnProperty(child)) {
                const { data } = await axios.get(`https://api.faithfulpack.net/v2/textures/${c[entry].children[child]}`);

                if (data.name === undefined && data.status === 404) {
                  return interaction.reply({
                    content: 'A texture with that id does not exist!',
                    ephemeral: true,
                  });
                }
                if (data === undefined) {
                  return interaction.reply({
                    content: 'The api is currently down!',
                    ephemeral: true,
                  });
                }

                description += `[#${c[entry].children[child]}] ${data.name ? data.name : '[undefined]'}\n`;
              }
            }
          } else {
            const { data } = await axios.get(`https://api.faithfulpack.net/v2/textures/${entry}`);

            if (data.name === undefined && data.status === 404) {
              return interaction.reply({
                content: 'A texture with that id does not exist!',
                ephemeral: true,
              });
            }
            if (data === undefined) {
              return interaction.reply({
                content: 'The api is currently down!',
                ephemeral: true,
              });
            }

            description += `**[#${entry}] ${data.name ? data.name : '[undefined]'}** - *${c[entry]}*\n`;
          }
          description += '\n';
        }
      }
    }
  }
  const embed = new MessageEmbed().setTitle('TEXTURE TODO LIST:').setDescription(description.substring(1)); // removes starting newline
  channel.send({
    embeds: [embed],
  });

  return Promise.resolve();
}
