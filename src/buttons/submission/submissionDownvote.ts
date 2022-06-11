import { Button } from '@interfaces';
import {
  Client, Message, ButtonInteraction, MessageEmbed,
} from '@client';
import { Submission } from '@class/TimedEmbed/Submission';

const button: Button = {
  buttonId: 'submissionDownvote',
  execute: async (client: Client, interaction: ButtonInteraction) => {
    await interaction.deferUpdate();
    const message: Message = interaction.message as Message;
    const embed: MessageEmbed = message.embeds[0];

    // get submission, update it
    const sid: string = embed.footer.text.split(' | ')[0];
    const submission: Submission = new Submission(client.submissions.get(sid));
    const { id } = interaction.user;

    if (submission.hasVotedFor('downvote', id)) submission.removeVote('downvote', id);
    else submission.addVote('downvote', id);

    await submission.updateSubmissionMessage(client, interaction.user.id);
    client.submissions.set(submission.id, submission);

    interaction.followUp({
      ephemeral: true,
      content: submission.hasVotedFor('downvote', interaction.user.id)
        ? 'Your vote has been counted.'
        : 'Your vote has been removed.',
    });
  },
};

export default button;
