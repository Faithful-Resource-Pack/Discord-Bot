/* eslint-disable no-unused-vars */
const prefix   = process.env.PREFIX

const uidR = process.env.UIDR
const uidJ = process.env.UIDJ
const uidD = process.env.UIDD
const uidT = process.env.UIDT

const strings                = require('../../ressources/strings')
const emojis                 = require('../../ressources/emojis')
const settings               = require('../../ressources/settings')
const allCollection          = require('../../helpers/firestorm/all')
const { retrieveSubmission } = require('../../functions/textures/submission/retrieveSubmission')
const { councilSubmission }  = require('../../functions/textures/submission/councilSubmission')
const { revoteSubmission }   = require('../../functions/textures/submission/revoteSubmission')
const { downloadResults }    = require('../../functions/textures/admission/downloadResults')
const { pushTextures }       = require('../../functions/textures/admission/pushTextures')

const contributionsCollection = require('../../helpers/firestorm/contributions')

module.exports = {
	name: 'hotfix',
	aliases: ['fix'],
	description: strings.HELP_DESC_HOTFIX,
	guildOnly: false,
	uses: strings.COMMAND_USES_DEVS,
	syntax: `${prefix}hotfix <something>`,
	args: true,
	async execute(client, message, args) {
		if (message.author.id === uidR || message.author.id === uidJ || message.author.id === uidD || message.author.id === uidT) {
			
			await councilSubmission(client, settings.C32_SUBMIT_COUNCIL, settings.C32_RESULTS, settings.C32_SUBMIT_REVOTE, 1)

		} else return
	}
}