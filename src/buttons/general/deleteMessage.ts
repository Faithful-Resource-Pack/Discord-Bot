import { Button } from '@interfaces';
import { info } from '@helpers/logger';
import { Client, Message, ButtonInteraction } from '@client';

const button: Button = {
  buttonId: 'deleteMessage',
  execute: async (client: Client, interaction: ButtonInteraction) => {
    if (client.verbose) console.log(`${info}Message deleted!`);
    const message: Message = interaction.message as Message;
    // as we can't fetch the interaction to detect who is the owner of the message/interaction, we uses the stored id inside the footer
    const authorId: string = interaction.message.embeds[0].footer.text.split(' | ')[1]; // splits by | to remove stuff before author id
    const sid: string = interaction.message.embeds[0].footer.text.split(' | ')[0];

    // additional checking for undefined embeds and footers and stuff
    if (!authorId) {
      interaction.reply({
        content: await interaction.getEphemeralString({
          string: 'Error.NotFound',
          placeholders: {
            THING: 'Author ID in footer',
          },
        }),
        ephemeral: true,
      });
      return;
    }

    if (interaction.user.id !== authorId) {
      // stupid check because undefined
      interaction.reply({
        content: await interaction.getEphemeralString({
          string: 'Error.Interaction.Reserved',
          placeholders: {
            USER: `<@!${authorId}>`,
          },
        }),
        ephemeral: true,
      });
      return;
    }

    try {
      message.delete();
    } catch (err) {
      interaction.reply({
        content: await interaction.getEphemeralString({
          string: 'Error.Message.Deleted',
        }),
        ephemeral: true,
      });
      return;
    }

    // try deleting submission from json file if sid is valid
    try {
      client.submissions.delete(sid);
    } catch {
      /* sid not valid */
    }
  },
};

export default button;
