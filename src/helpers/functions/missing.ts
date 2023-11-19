import { exec, series } from "@helpers/exec";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import formatName from "@utility/formatName";
import { Client } from "@client";
import { ChannelType } from "discord.js";
import { join, normalize } from "path";

import blacklistedTextures from "@json/blacklisted_textures.json";
import axios from "axios";
import { FaithfulPack } from "@interfaces/firestorm";

// starting from process.cwd()
export const BASE_REPOS_PATH = "repos";

// return value for the compute function
export interface MissingData {
	completion: number;
	edition: string;
	pack: FaithfulPack;
	version: string;
	total?: number;
}

export interface MissingResult {
	diffFile: Buffer;
	results: string[];
	data: MissingData;
	nonvanillaFile?: Buffer;
}

export const computeAll = async (
	client: Client,
	pack: FaithfulPack,
	version: string,
	callback: Function,
): Promise<MissingResult[]> => {
	const editions: string[] = (await axios.get(`${client.tokens.apiUrl}textures/editions`)).data;

	return Promise.all(
		editions.map(
			async (edition: string) => await compute(client, pack, edition, version, callback),
		),
	);
};

export const computeAndUpdateAll = async (
	client: Client,
	pack: FaithfulPack,
	version: string,
	callback: Function,
): Promise<MissingResult[]> => {
	const editions: string[] = (await axios.get(`${client.tokens.apiUrl}textures/editions`)).data;

	return Promise.all(
		editions.map(
			async (edition: string) => await computeAndUpdate(client, pack, edition, version, callback),
		),
	);
};

/**
 * same interface as compute but updates the VCs too
 */
export const computeAndUpdate = async (
	client: Client,
	pack: FaithfulPack,
	edition: string,
	version: string,
	callback: Function,
): Promise<MissingResult> => {
	const results = await compute(client, pack, edition, version, callback);
	if (!client) return results;

	let packProgress: any;
	try {
		const prom = await axios
			.get(`${client.tokens.apiUrl}settings/channels.pack_progress`)
			// fix for "Error: socket hang up"
			.catch(() => axios.get(`https://api.faithfulpack.net/v2/settings/channels.pack_progress`));
		packProgress = prom.data;
	} catch {
		return results;
	}

	const channel = client.channels.cache.get(packProgress[results.data.pack][results.data.edition]);
	// channel doesn't exist or can't be fetched, return early
	if (!channel) return results;

	// you can add different patterns depending on the channel type
	switch (channel.type) {
		case ChannelType.GuildVoice:
			const pattern = /[.\d+]+(?!.*[.\d+])/;
			if (channel.name.match(pattern)?.[0] == results.data.completion.toString()) break;
			const updatedName = channel.name.replace(pattern, results.data.completion.toString());
			channel.setName(updatedName).catch(console.error);
			break;
	}

	return results;
};

/**
 * this is the main computing function that all the other ones use internally
 */
export const compute = async (
	client: Client,
	pack: FaithfulPack,
	edition: string,
	version: string,
	callback: Function,
): Promise<MissingResult> => {
	if (callback === undefined) callback = async () => {};

	const repo = (await axios.get(`${client.tokens.apiUrl}settings/repositories.git`)).data;
	const repoDefault = repo.default[edition];
	const repoRequest = repo[pack][edition];

	// pack doesn't support edition yet
	if (repoRequest === undefined)
		return {
			diffFile: null,
			results: [`${formatName(pack)[0]} doesn't support ${edition} edition.`],
			data: { completion: 0, pack, edition, version },
		};

	const basePath = join(process.cwd(), BASE_REPOS_PATH);
	const defaultPath = join(basePath, `missing-default-${edition}`);
	const packPath = join(basePath, `missing-${pack}-${edition}`);

	// CLONE REPO IF NOT ALREADY CLONED
	if (!existsSync(defaultPath)) {
		await callback(`Downloading default ${edition} pack...`);
		mkdirSync(defaultPath, { recursive: true });
		await exec(`git clone ${repoDefault} .`, { cwd: defaultPath });
	}

	if (!existsSync(packPath)) {
		await callback(`Downloading \`${formatName(pack)[0]}\` (${edition}) pack...`);
		mkdirSync(packPath, { recursive: true });
		await exec(`git clone ${repoRequest} .`, { cwd: packPath });
	}

	const versions: string[] = (
		await axios.get(`${client.tokens.apiUrl}textures/versions/${edition}`)
	).data;
	// latest version if versions doesn't include version (unexisting/unsupported)
	if (!versions.includes(version)) version = versions[0];
	await callback(`Updating packs with latest version of \`${version}\` known...`);

	// for some reason specifying the steps in a variable and loading it here breaks?
	await Promise.all([
		series(["git stash", "git remote update", "git fetch", `git checkout ${version}`, `git pull`], {
			cwd: defaultPath,
		}),
		series(["git stash", "git remote update", "git fetch", `git checkout ${version}`, `git pull`], {
			cwd: packPath,
		}),
	]);

	await callback("Searching for differences...");

	const editionFilter = blacklistedTextures[edition].map(normalize);

	const texturesDefault = getAllFilesFromDir(defaultPath, editionFilter).map((f) =>
		normalize(f).replace(defaultPath, ""),
	);
	const texturesRequest = getAllFilesFromDir(packPath, editionFilter).map((f) =>
		normalize(f).replace(packPath, ""),
	);

	// instead of looping in the check array for each checked element, we directly check if the
	// object has a value for the checked key
	const check = texturesRequest.reduce((o, key) => ({ ...o, [key]: true }), {});

	// get texture that aren't in the check object
	const diffResult = texturesDefault.filter((v) => !check[v]);
	const nonvanillaTextures = texturesRequest.filter(
		(texture) =>
			!texturesDefault.includes(texture) &&
			!texture.endsWith("huge_chungus.png") && // we do a little trolling
			!editionFilter.includes(texture) &&
			(texture.replace(/\\/g, "/").startsWith("/assets/minecraft/textures") ||
				texture.replace(/\\/g, "/").startsWith("/assets/realms") ||
				texture.replace(/\\/g, "/").startsWith("/textures")),
	);

	const progress = Number((100 * (1 - diffResult.length / texturesDefault.length)).toFixed(2));

	return {
		diffFile: Buffer.from(formatResults(diffResult), "utf8"),
		results: diffResult,
		data: {
			completion: progress,
			edition,
			pack,
			version,
			total: texturesDefault.length,
		},
		nonvanillaFile: Buffer.from(formatResults(nonvanillaTextures), "utf8"),
	};
};

export const getAllFilesFromDir = (dir: string, filter: string[] = []): string[] => {
	const fileList = [];
	readdirSync(dir).forEach((file) => {
		file = normalize(join(dir, file));
		const stat = statSync(file);

		if (file.includes(".git")) return;
		if (stat.isDirectory()) return fileList.push(...getAllFilesFromDir(file, filter));
		if (
			blacklistedTextures.allowed_extensions.some((ex) => file.endsWith(`.${ex}`)) &&
			!filter.some((i) => file.includes(i))
		)
			fileList.push(file);
	});

	return fileList;
};

export const formatResults = (results: string[]) =>
	results
		.join("\n")
		.replace(/\\/g, "/")
		.replace(/\/assets\/minecraft/g, "")
		// only match at start of line so realms/optifine aren't affected
		.replace(/^\/textures\//gm, "");
