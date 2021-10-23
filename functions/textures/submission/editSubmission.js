const emojis   = require('../../../resources/emojis')
const settings = require('../../../resources/settings')
const colors   = require('../../../resources/colors')

const { Permissions }    = require('discord.js');
const { magnify }        = require('../../../functions/textures/magnify')
const { palette }        = require('../../../functions/textures/palette')
const { tile }           = require('../tile')
const compareCommand = require('../../../commands/minecraft/compare')

const CANVAS_FUNCTION_PATH = '../../../functions/textures/canvas'
function nocache(module) { require('fs').watchFile(require('path').resolve(module), () => { delete require.cache[require.resolve(module)] }) }
nocache(CANVAS_FUNCTION_PATH)

/**
 * Edit the embed of the submission
 * @author Juknum
 * @param {DiscordClient} client
 * @param {DiscordReaction} reaction
 * @param {DiscordUser} user
 */
async function editSubmission(client, reaction, user) {
  const message  = await reaction.message.fetch()
  const member   = await message.guild.members.cache.get(user.id)
  if (member.bot === true) return
  if (message.embeds.length == 0 || message.embeds[0].fields.length == 0) return

  const authorID = await message.embeds[0].fields[0].value.split('\n').map(el => el.replace('<@', '').replace('!', '').replace('>', ''))[0]

  if (reaction.emoji.id === emojis.SEE_MORE || reaction.emoji.id === emojis.SEE_MORE_OLD) {

    reaction.remove().catch(err => { if (process.DEBUG) console.error(err)} )

    let EMOJIS = [emojis.SEE_LESS, emojis.DELETE, emojis.INSTAPASS, emojis.INVALID, emojis.MAGNIFY, emojis.PALETTE, emojis.TILE, emojis.COMPARE]

    // if the message does not have up/down vote react, remove INSTAPASS & INVALID from the emojis list (already instapassed or votes flushed)
    if (!message.embeds[0].fields[1].value.includes('⏳')) EMOJIS = EMOJIS.filter(emoji => emoji !== emojis.INSTAPASS && emoji !== emojis.INVALID && emoji !== emojis.DELETE)

		// if the message is in #council-vote #texture-revote, remove delete reaction (avoid missclick)
		if (message.channel.id === settings.C32_SUBMIT_COUNCIL || message.channel.id === settings.C32_SUBMIT_REVOTE || message.channel.id === settings.C32_SUBMIT_COUNCIL || message.channel.id === settings.C32_SUBMIT_REVOTE) EMOJIS = EMOJIS.filter(emoji => emoji !== emojis.DELETE)

    // add reacts
    for (let i = 0; EMOJIS[i]; i++) await message.react(EMOJIS[i])

    // make the filter
    const filter = (REACT, USER) => {
      return EMOJIS.includes(REACT.emoji.id) && USER.id === user.id
    }

    // await reaction from the user
    message.awaitReactions({filter, max: 1, time: 30000, errors: [ 'time' ] })
    .then(async collected => {
      const REACTION = collected.first()
      const USER_ID  = [...collected.first().users.cache.values()].filter(user => user.bot === false).map(user => user.id)[0]
			
      if (REACTION.emoji.id === emojis.PALETTE)      palette(message, message.embeds[0].image.url, user.id)
      else if (REACTION.emoji.id === emojis.MAGNIFY) magnify(message, message.embeds[0].image.url, user.id)
      else if (REACTION.emoji.id === emojis.TILE)    tile(message, message.embeds[0].image.url, 'grid', user.id)
      
			/**
			 * TODO: find why you can't have 2 textures of the same resolution in the drawer.urls (the texture isn't processed??)
			 */
			else if (REACTION.emoji.id === emojis.COMPARE) {
        const member = await message.guild.members.cache.get(user.id)
        const embed = message.embeds[0]
        
        const textureTitle = embed.title
        const textureId = textureTitle.substring(textureTitle.indexOf('#') + 1, textureTitle.indexOf(']')).trim()

        let editions_letters = embed.fields.filter(f => f.inline !== undefined && f.inline === false)
        editions_letters = editions_letters.map(e => e.value.charAt(2).toLowerCase())
        editions_letters = editions_letters.filter((e, i) => editions_letters.indexOf(e) === i)
        const command_arguments = ['--id', textureId, '-r']
        const res = ['16', '32', '64']
        res.forEach(r => {
          editions_letters.forEach(e => {
            command_arguments.push(r + e)
          })
        })
				const	baseMessage = await member.send("Launching compare for: ``" + textureTitle + "``...")
        await compareCommand.execute(client, baseMessage, command_arguments)
      }

      /**
       * TODO: for instapass & flush reacts, check if the user who reacted have the Council role, and not admin perms
       */
      if (REACTION.emoji.id === emojis.INSTAPASS && member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        removeReact(message, [emojis.UPVOTE, emojis.DOWNVOTE])
        changeStatus(message, `<:instapass:${emojis.INSTAPASS}> Instapassed`)
        instapass(client, message)
      }
      if (REACTION.emoji.id === emojis.INVALID && member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        removeReact(message, [emojis.UPVOTE, emojis.DOWNVOTE])
        changeStatus(message, `<:invalid:${emojis.INVALID}> Invalid`)
      }

      // delete message only if the first author of the field 0 is the discord user who reacted, or if the user who react is admin
      if (REACTION.emoji.id === emojis.DELETE && (USER_ID === authorID || member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))) return await message.delete()

      removeReact(message, EMOJIS)
      await message.react(client.emojis.cache.get(emojis.SEE_MORE))

    })
    .catch(async err => {
      if (!message.deleted) {
        removeReact(message, EMOJIS)
        await message.react(client.emojis.cache.get(emojis.SEE_MORE))
      }

			console.log(err)
    })
  }
  
}

async function instapass(client, message) {
  let channelOut
  if (message.channel.id == settings.C32_SUBMIT_TEXTURES)      channelOut = await client.channels.fetch(settings.C32_RESULTS) // obtains the channel or returns the one from cache
  else if (message.channel.id == settings.C64_SUBMIT_TEXTURES) channelOut = await client.channels.fetch(settings.C64_RESULTS) // obtains the channel or returns the one from cache

  channelOut.send({ embeds:
    [message.embeds[0]
      .setColor(colors.GREEN)
      .setDescription(`[Original Post](${message.url})\n${message.embeds[0].description ? message.embeds[0].description : ''}`)
    ]
  })
  .then(async sentMessage => {
      for (const emojiID of [emojis.SEE_MORE]) await sentMessage.react(client.emojis.cache.get(emojiID))
    })

  editEmbed(message)
}

async function editEmbed(message) {
  let embed = message.embeds[0]
  // fix the weird bug that also apply changes to the old embed (wtf)
	if (message.channel.id == '841396215211360296') embed.setColor(colors.BLUE)
  else if (message.channel.id == settings.C32_SUBMIT_TEXTURES || message.channel.id == settings.C64_SUBMIT_TEXTURES) 
		embed.setColor(colors.BLUE)
	else if (message.channel.id == settings.C32_SUBMIT_COUNCIL || message.channel.id == settings.C64_SUBMIT_COUNCIL) 
		embed.setColor(colors.COUNCIL)
	else if (message.channel.id == settings.C32_SUBMIT_REVOTE || message.channel.id == settings.C64_SUBMIT_REVOTE) 
		embed.setColor(colors.RED)

  if (embed.description !== null) embed.setDescription(message.embeds[0].description.replace(`[Original Post](${message.url})\n`, ''))

  await message.edit({embeds: [embed]})
}

async function changeStatus(message, string) {
  let embed = message.embeds[0]
  embed.fields[1].value = string
  await message.edit({embeds: [embed]})
}

async function removeReact(message, emojis) {
  for (let i = 0; emojis[i]; i++) {
    await message.reactions.cache.get(emojis[i]).remove().catch(err => {
      if (process.DEBUG) console.error(`Can't remove emoji: ${emojis[i]}\n${err}`)
    })
  }
}

exports.editSubmission = editSubmission