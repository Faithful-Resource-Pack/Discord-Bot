const Discord   = require("discord.js");
const colors    = require('../../res/colors.js');
const settings  = require('../../settings.js');
const urlExists = require('url-exists');
const { warnUser } = require('../warnUser');
const { timestampConverter } = require('../timestampConverter');

const CANVAS_FUNCTION_PATH = '../../functions/canvas'
function nocache(module) { require('fs').watchFile(require('path').resolve(module), () => { delete require.cache[require.resolve(module)] }) }
nocache(CANVAS_FUNCTION_PATH)

/**
 * Quote when a user specify a list of valids texture id's
 * @param {DiscordMessage} message Discord message
 * @param {String} content message content 
 */
async function textureIDQuote(message) {
  const args = message.content.split(' ') // get all words in the message content
  let ids = args.filter(el => el.charAt(0) === '#' && !isNaN(el.slice(1))).map(el => el.slice(1)) // filter textures ids and slice '#'
  ids = ids.filter((el, index) => ids.indexOf(el) === index && el > 0) // avoid doublon and wrong id

  const texturesCollection = require('../../helpers/firestorm/texture')
  const promiseEvery = require('../../helpers/promiseEvery')
  const promiseArray = ids.map(id => texturesCollection.get(id))

  let res = await promiseEvery(promiseArray).catch(err => console.error(err))
  
  if (!res) return // if nothing is found -> we don't deserve it.
  else res = res.results.filter(el => el !== undefined)

  for (let i = 0; i < res.length; i++) {
    let texture = res[i];

    let id = texture.id
    let name = texture.name

    /** @type {import("../../helpers/firestorm/texture_use.js").TextureUse[]} */
    let uses = await texture.uses()

    /** @type {import("../../helpers/firestorm/texture_paths.js").TexturePath[]} */
    let texturePath = await uses[0].paths()

    let path = texturePath[0].path
    let editions = uses[0].editions

    let contrib32 = await texture.lastContribution('c32')
    let timestamp32 = contrib32 ? contrib32.date : undefined
    let author32 = contrib32 ? contrib32.contributors : undefined

    let contrib64 = await texture.lastContribution('c64')
    let timestamp64 = contrib64 ? contrib64.date : undefined
    let author64 = contrib64 ? contrib64.contributors : undefined

    const paths = {}
    if (editions.includes('java')) {
      paths.c16 = settings.DEFAULT_MC_JAVA_TEXTURE + path;
      paths.c32 = `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Java-32x/Jappa-1.17/assets/${path}`
      paths.c64 = `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Java-64x/Jappa-1.17/assets/${path}`
    } 
    else {
      paths.c16 = settings.DEFAULT_MC_BEDROCK_TEXTURE + path;
      paths.c32 = `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Bedrock-32x/Jappa-1.16.210/${path}`
      paths.c64 = `https://raw.githubusercontent.com/Compliance-Resource-Pack/Compliance-Bedrock-64x/Jappa-1.16.210/${path}`
    }

    /** @type {import('../helpers/firestorm/users').User} */

    let author = [ author32, author64 ]
    let timestamp = [ timestamp32, timestamp64 ]

    const CanvasDrawer = require(CANVAS_FUNCTION_PATH)
    const drawer = new CanvasDrawer()

    /**
     * TODO: test if the url return 404 : if true, remove it from the array
     */
    drawer.urls = [paths.c16, paths.c32, paths.c64]

    const bufferResult = await drawer.draw().catch(err => { throw err })
    const attachment = new Discord.MessageAttachment(bufferResult, 'output.png')

    var embed = new Discord.MessageEmbed()
      .setTitle(`[#${id}] - ${name}`)
      .setColor(colors.BLUE)
      .attachFiles(attachment)
      .setImage('attachment://output.png')
      .addFields(
        { name: '32x', value: author[0] != undefined && author[0].length ? `<@!${author[0].join('> <@!')}> - ${timestampConverter(timestamp[0])}` : `No information` },
        { name: '64x', value: author[1] != undefined && author[1].length ? `<@!${author[1].join('> <@!')}> - ${timestampConverter(timestamp[1])}` : `No information` }
      )

    return message.inlineReply(embed)
  }

}

exports.textureIDQuote = textureIDQuote