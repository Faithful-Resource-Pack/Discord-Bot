import { MessageEmbed } from "@client";
import ConfigJson from "@json/config.json";
import { Config } from "@interfaces";
import axios from "axios";
import getMeta from "./canvas/getMeta";
import { MessageAttachment } from "discord.js";
import { magnifyAttachment } from "./canvas/magnify";
import { ISizeCalculationResult } from "image-size/dist/types/interface";
import { colors } from "@helpers/colors";
import { fromTimestampToHumanReadable } from "@helpers/dates";
import { Contributions, Texture, Paths, Uses } from "@helpers/interfaces/firestorm";
import { animateAttachment } from "./canvas/animate";
import { MinecraftSorter } from "@helpers/sorter";

export const getTextureMessageOptions = async (options: {
	texture: Texture;
	pack: string;
}): Promise<[MessageEmbed, Array<MessageAttachment>]> => {
	const config: Config = ConfigJson;
	const texture = options.texture;
	const pack = options.pack;
	const uses: Uses = texture.uses;
	const paths: Paths = texture.paths;
	const contributions: Contributions = texture.contributions;
	const animated: boolean = paths.filter((p) => p.mcmeta === true).length !== 0;

	let mcmeta: any = {};
	if (animated) {
		const [animatedPath] = paths.filter((p) => p.mcmeta === true);
		const animatedUse = uses.find((u) => u.id === animatedPath.use);

		try {
			mcmeta = (
				await axios.get(
					`https://raw.githubusercontent.com/CompliBot/Default-Java/${
						animatedPath.versions.sort(MinecraftSorter).reverse()[0]
					}/assets/${animatedUse.assets}/${animatedPath.name}.mcmeta`,
				)
			).data;
		} catch {
			mcmeta = { __comment: "mcmeta file not found, please check default repository" };
		}
	}

	let strPack: string;
	let strIconURL: string;

	// TODO: use API here
	switch (pack) {
		case "faithful_32x":
			strPack = "Faithful 32x";
			strIconURL = config.images + "branding/logos/transparent/512/f32_logo.png";
			break;
		case "faithful_64x":
			strPack = "Faithful 64x";
			strIconURL = config.images + "branding/logos/transparent/512/f64_logo.png";
			break;
		case "classic_faithful_32x":
			strPack = "Classic Faithful 32x";
			strIconURL = config.images + "branding/logos/transparent/512/cf32_logo.png";
			break;
		case "classic_faithful_32x_progart":
			strPack = "Classic Faithful 32x Programmer Art";
			strIconURL = config.images + "branding/logos/transparent/512/cf32pa_logo.png";
			break;
		case "classic_faithful_64x":
			strPack = "Classic Faithful 64x";
			strIconURL = config.images + "branding/logos/transparent/512/cf64_logo.png";
			break;

		default:
		case "default":
			strPack = "Minecraft Default";
			strIconURL = config.images + "bot/texture_16x.png";
			break;
	}

	const files: Array<MessageAttachment> = [];
	const embed = new MessageEmbed().setTitle(`[#${texture.id}] ${texture.name}`).setFooter({
		text: `${strPack}`,
		iconURL: strIconURL,
	});

	let textureURL: string;
	try {
		textureURL = (await axios.get(`${config.apiUrl}textures/${texture.id}/url/${pack}/latest`)).request.res.responseUrl;
	} catch {
		textureURL = "";
	}

	embed.setThumbnail(textureURL);
	embed.setImage(`attachment://magnified.${animated ? "gif" : "png"}`);

	// test if url isn't a 404
	let validURL: boolean = false;
	let dimensions: ISizeCalculationResult;
	try {
		dimensions = await getMeta(textureURL);
		validURL = true;
	} catch (err) {
		textureURL = "https://raw.githubusercontent.com/Faithful-Resource-Pack/App/main/resources/transparency.png";
		embed.addFields([
			{ name: "Image not found", value: "This texture hasn't been made yet or is blacklisted!"}
		]);
		embed.setColor(colors.red);
	}

	if (validURL) {
		embed.addFields([
			{ name: "Resolution", value: `${dimensions.width}×${dimensions.height}`, inline: true },
			{ name: "\u200B", value: `[View texture online](https://webapp.faithfulpack.net/#/gallery/java/32x/latest/all/?show=${texture.id})`, inline: true },
		]);

		const displayedContributions = [
			contributions
				.filter((c) => strPack.includes(c.resolution.toString()) && pack === c.pack)
				.sort((a, b) => (a.date > b.date ? -1 : 1))
				.map((c) => {
					let strDate: string = `<t:${Math.trunc(c.date / 1000)}:d>`;
					let authors = c.authors.map((authorId: string) => `<@!${authorId}>`);
					return `${strDate} — ${authors.join(", ")}`;
				})[0],
		];

		if (displayedContributions[0] != undefined && contributions.length && pack !== "default")
			embed.addFields([
				{ name: "Latest Author(s)", value: displayedContributions.join("\n") }
			]);
	}

	let tmp = {};
	uses.forEach((use) => {
		paths
			.filter((el) => el.use === use.id)
			.forEach((p) => {
				const versions = p.versions.sort(MinecraftSorter);
				if (tmp[use.edition])
					tmp[use.edition].push(
						`\`[${versions.length > 1 ? `${versions[0]} — ${versions[versions.length - 1]}` : versions[0]}]\` ${
							use.assets !== null && use.assets !== "minecraft" ? use.assets + "/" : ""
						}${p.name}`,
					);
				else
					tmp[use.edition] = [
						`\`[${versions.length > 1 ? `${versions[0]} — ${versions[versions.length - 1]}` : versions[0]}]\` ${
							use.assets !== null && use.assets !== "minecraft" ? use.assets + "/" : ""
						}${p.name}`,
					];
			});
	});

	Object.keys(tmp).forEach((edition) => {
		if (tmp[edition].length > 0) {
			embed.addFields([{
				name: edition.charAt(0).toLocaleUpperCase() + edition.slice(1),
				value: tmp[edition].join("\n").replaceAll(" textures/", "../"),
			}]);
		}
	});

	// magnifying the texture in thumbnail
	if (animated) {
		embed.addFields([{ name: "MCMETA", value: `\`\`\`json\n${JSON.stringify(mcmeta)}\`\`\`` }]);
		files.push(await animateAttachment({ url: textureURL, magnify: true, name: "magnified.gif", mcmeta }));
	} else files.push((await magnifyAttachment({ url: textureURL, name: "magnified.png" }))[0]);

	return [embed, files];
};
