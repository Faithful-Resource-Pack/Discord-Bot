import { IModal } from '@interfaces';
import { ModalSubmitInteraction, CacheType } from 'discord.js';
import { octokit, templateLoad } from '@utils';
import { EmbedBuilder } from '@overrides';

export default {
  id: 'feedback-generic',
  run: async (interaction: ModalSubmitInteraction<CacheType>) => {
    const title = interaction.fields.getTextInputValue('feedback-input-feedback-title');
    const description = interaction.fields.getTextInputValue('feedback-input-feedback-description');

    const footer = templateLoad('feedbackFooter.html')
      .replace('%USER_AVATAR%', interaction.user.displayAvatarURL())
      .replace('%USER_ID%', interaction.user.id)
      .replace('%USER_NAME%', interaction.user.username);

    const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: 'Faithful-Resource-Pack',
      repo: 'Discord-Bot',
      title: `[Feedback] ${title}`,
      body: description + footer,
      assignees: [
        'Juknum',
      ],
      labels: [
        'feedback',
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(String.get('modal_feedback_generic_title', interaction.locale))
      .setDescription(String.get('modal_feedback_generic_description', interaction.locale, { keys: { LINK: `${response.data.html_url}` } }))
      .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as IModal;
