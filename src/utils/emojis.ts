import { Snowflake } from 'discord.js';

/**
 * Emojis used in the bot.
 */
export enum Emojis {
  bug = '959344133145755648',
  suggestion = '959344133158350869',
  view_votes = '949830600125194281',
  planet_mc = '863132124333080576',
  curseforge = '863132124306472980',
  f32_logo = '963455577630064741',
  f64_logo = '963455576690556998',
  dungeons_logo = '963455576649905890',
  extras_logo = '963455575520342016',
  mods_logo = '963455576833138720',
  faithful_logo = '963455577105788959',
  tweaks_logo = '963455577453887518',
  addons_logo = '963455574656286750',
  magnify = '918186631226339339',
  invalid = '918186621323579433',
  instapass = '918186611794137168',
  see_less = '918186673496543242',
  see_more = '918186683055349810',
  palette = '918186650822131742',
  upvote = '918186701975859307',
  downvote = '918186603007078420',
  delete = '918186593683124235',
  compare = '918186583176405032',
  tile = '918186692307996723',
  next_res = '918186640571256842',
  pending = '918186662780092537',
  flip_tiling = '942014073141334056',
  rotate_tiling = '942014072818376716',
}

/**
 * Function used to mention a custom emoji in a text message
 * @param {Snowflake} id The id of the emoji
 * @returns {String} The emoji mention
 */
export function mentionEmoji(id: Snowflake): string {
  return `<:${Object.keys(Emojis)[Object.values(Emojis).indexOf(id as any)]}:${id}>`;
}
