/* eslint-disable no-redeclare */
const Discord  = require('discord.js')
const settings = require('../../settings.js')
const colors   = require('../../res/colors.js')
const strings  = require('../../res/strings.js')
const fs       = require('fs')
const fetch    = require('node-fetch')

const DEBUG = (process.env.DEBUG == 'true')

const { date } = require('../utility/date.js')
const { getMessages } = require('../getMessages.js')
const { jsonContributionsBedrock, jsonContributionsJava } = require('../../helpers/fileHandler.js')

/**
 * Check if embed messages use green color and download image attached if true.
 * @param {Discord} client Discord Client
 * @param {String} inputID Discord Channel ID (Input)
 * @param {Number} OFFSET_DAY Number of day since the message have been posted
 */
async function getResults(client, inputID, OFFSET_DAY = 0) {
	// set offset (used for development)
	var offsetDate = new Date()
	offsetDate.setDate(offsetDate.getDate() - OFFSET_DAY)

	// get message list:
	let messages = await getMessages(client, inputID)

	for (var i in messages) {
		var texturesBedrock = await jsonContributionsBedrock.read()
		var texturesJava    = await jsonContributionsJava.read()

		let message     = messages[i]
		let messageDate = new Date(message.createdTimestamp)

		// if message is an embed && offset date == message date && embed color is green
		if (
			message.embeds[0] != undefined && 
			message.embeds[0].color == 5025616 && 
			messageDate.getDate() == offsetDate.getDate() && 
			messageDate.getMonth() == offsetDate.getMonth()) 
		{
			var textureAuthor = message.embeds[0].author.name
			var textureName   = message.embeds[0].fields[0].value.replace('.png','') + '.png'
			var textureFolder = message.embeds[0].fields[1].value
			var textureType   = message.embeds[0].fields[2].value || undefined
			var textureSize   = undefined
			var textureIndex  = -1

			try {
				var textureAuthorID = client.users.cache.find(u => u.tag === textureAuthor).id || undefined
			} catch (e) {
				errorAutoPush(client, inputID, message, textureAuthor, textureName, textureFolder, textureType, `Can't find user ID! the user may have changed his nickname, Juknum#6148 ≠ juknum#6148`)
			}

			var folder = undefined
			var search = undefined

			// get contributor files:

			if (textureType == 'java') {
				if (textureFolder.includes('realms')) {
					folder = textureFolder.replace('realms/textures/','')
					search = `realms/textures/${folder}/${textureName}`
				} else {
					folder = textureFolder.replace('minecraft/textures/','')
					search = `minecraft/textures/${folder}/${textureName}`
				}

				for (var i = 0; i < texturesJava.length; i++) {
					if (texturesJava[i].version[strings.LATEST_MC_JE_VERSION].includes(search)) {
						textureIndex = i
						if (inputID == settings.C32_RESULTS) textureSize = 32
						if (inputID == settings.C64_RESULTS) textureSize = 64
						break
					}
				}
			} 
			else if (textureType == 'bedrock') {
				folder = textureFolder.replace('textures/','')
				search = `textures/${folder}/${textureName}`
					for (var i = 0; i < texturesBedrock.length; i++) {
					if (texturesBedrock[i].version[strings.LATEST_MC_BE_VERSION].includes(search)) {
						textureIndex = i
						if (inputID == settings.C32_RESULTS) textureSize = 32
						if (inputID == settings.C64_RESULTS) textureSize = 64
						break
					}
				}
			} else errorAutoPush(client, inputID, message, textureAuthor, textureName, textureFolder, textureType, `No Resource Pack type set up!`)


			if (textureIndex == -1 && (textureType == 'java' || textureType == 'bedrock')) {
				if (DEBUG) console.log(`\nTEXTURE NOT FOUND: ${textureName}`)
				errorAutoPush(client, inputID, message, textureAuthor, textureName, textureFolder, textureType, `Texture not found, check spelling or folder`)
			}

			else if (textureIndex != -1 && (textureType == 'java' || textureType == 'bedrock')) {

				// Convert texture from java to bedrock (if available)
				if (textureType == 'java' && texturesJava[textureIndex].isBedrock == true) {
					search = texturesJava[textureIndex].bedrock[strings.LATEST_MC_BE_VERSION]

					for (var i = 0; i < texturesBedrock.length; i++) {
						// search corresponding texture inside bedrock.json
						if (texturesBedrock[i].version[strings.LATEST_MC_BE_VERSION].includes(search)) {
							// Download texture to bedrock local file
							await download_branch(client, message.embeds[0].image.url, texturesBedrock[i].version['1.16.210'], textureSize, textureName, '1.16.210', 'bedrock')
							break // break if file is found (stop the for loop & avoid double push)
						}
					}
				}

				// Download files to local folder
				if (textureType == 'java') {

					if (texturesJava[textureIndex] == undefined) {
						console.log(`textureIndex failed: ${textureIndex} - ${textureSize} - ${textureName}`)
						break
					}

					if (DEBUG) console.log(`\nADDING: ${textureName}`)
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.17'],   textureSize, textureName, '1.17',   'java')
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.16.5'], textureSize, textureName, '1.16.5', 'java')
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.15.2'], textureSize, textureName, '1.15.2', 'java')
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.14.4'], textureSize, textureName, '1.14.4', 'java')
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.13.2'], textureSize, textureName, '1.13.2', 'java')
					await download_branch(client, message.embeds[0].image.url, texturesJava[textureIndex].version['1.12.2'], textureSize, textureName, '1.12.2', 'java')

				}
				else if (textureType == 'bedrock') {
					if (DEBUG) console.log(`\nADDING: ${textureName}`)
					await download_branch(client, message.embeds[0].image.url, texturesBedrock[textureIndex].version['1.16.210'], textureSize, textureName, '1.16.210', 'bedrock')
				}

				await setAuthor(textureType, textureIndex, textureAuthorID, textureSize)
			}
		}
		// break for loop to avoid looping in older message (time saving)
		else if (messageDate.getDate() != offsetDate.getDate() || messageDate.getMonth() != offsetDate.getMonth()) {
			if (DEBUG) console.log('END OF DOWNLOADS')
			break
		}

		jsonContributionsJava.release()
		jsonContributionsBedrock.release()
		if (textureIndex != -1 && (textureType == 'java' || textureType == 'bedrock')) await setAuthor(textureType, textureIndex, textureAuthorID, textureSize)
	}

	try {
		jsonContributionsJava.release()
		jsonContributionsBedrock.release()
	} catch(e) {
		console.log(e)
	}
}

async function download_branch(client, textureURL, texturePath, textureSize, textureName, branch, type) {
	if (texturePath == null || texturePath == undefined) return

	var localPath = undefined
	if      (textureSize == 32 && type == 'java')    localPath = `./texturesPush/Compliance-Java-32x/${branch}/assets/${texturePath}`
	else if (textureSize == 64 && type == 'java')    localPath = `./texturesPush/Compliance-Java-64x/${branch}/assets/${texturePath}`
	else if (textureSize == 32 && type == 'bedrock') localPath = `./texturesPush/Compliance-Bedrock-32x/${branch}/${texturePath}`
	else if (textureSize == 64 && type == 'bedrock') localPath = `./texturesPush/Compliance-Bedrock-64x/${branch}/${texturePath}`

	else if (localPath == undefined) {
		return errorAutoPush(client, 0, 'localPath undefined', textureURL, textureName, texturePath, textureSize, 'localPath == undefined')
	}

	const response = await fetch(textureURL)
	const buffer   = await response.buffer()
	await fs.promises.mkdir(localPath.substr(0, localPath.lastIndexOf('/')), {recursive: true}).catch(console.error)
	await fs.writeFile(localPath, buffer, function(err) {
		if (err) return console.error(err)
		else return console.log(`ADDED TO: ${localPath}`)
	})
}

async function errorAutoPush(client, inputID, message, author, name, folder, type, error) {
	var errorChannel = client.channels.cache.get(settings.C32_AUTOPUSH_FAIL)
	if (inputID == settings.C64_RESULTS) errorChannel = client.channels.cache.get(settings.C64_AUTOPUSH_FAIL)

	var embed = new Discord.MessageEmbed()
		.setColor(colors.YELLOW)
		.setAuthor(author, message.embeds[0].author.iconURL)
		.setDescription(`Something went wrong during autopush:\nError: ${error}`)
		.addFields(
			{ name: 'Name:',   value: name,   inline: true },
			{ name: 'Folder:', value: folder, inline: true },
			{ name: 'Type:',   value: type,   inline: true }
		)
		
		if (message.embeds[0].title) {
			embed.setTitle(message.embeds[0].title).setURL(message.embeds[0].url)
		}
		else embed.setImage(message.embeds[0].image.url)

	await errorChannel.send(embed)
}

async function setAuthor(valType, valIndex, valAuth, valSize) {
	let fileHandle
	let textures

	if (valType == 'java')    fileHandle = jsonContributionsJava
	if (valType == 'bedrock') fileHandle = jsonContributionsBedrock

	textures = await fileHandle.read()

	if (valSize == 32) {
		textures[valIndex].c32.date   = date()
		textures[valIndex].c32.author = [valAuth]
		if (DEBUG) console.log(`ADD ${valAuth} AS 32x AUTHOR OF ${valType}`)
	}
	if (valSize == 64) {
		textures[valIndex].c64.date   = date()
		textures[valIndex].c64.author = [valAuth]
		if (DEBUG) console.log(`ADD ${valAuth} AS 64x AUTHOR OF ${valType}`)
	}

	if (valType == 'java')    await jsonContributionsJava.write(textures)
	if (valType == 'bedrock') await jsonContributionsBedrock.write(textures)

	fileHandle.release()

	if (valType == 'java' && textures[valIndex].isBedrock) {
		let found = false
		let index = -1

		fileHandle = jsonContributionsBedrock
		var texturesBedrock = await fileHandle.read()

		for (var i in texturesBedrock) {
			if (texturesBedrock[i].version[strings.LATEST_MC_BE_VERSION].includes(textures[valIndex].bedrock[strings.LATEST_MC_BE_VERSION])) {
				found = true
				index = i
			}
		}

		if (found) {
			fileHandle.release()
			await setAuthor('bedrock', index, valAuth, valSize)
		}
	}

	return
}

exports.getResults = getResults