<img src="https://raw.githubusercontent.com/Faithful-Resource-Pack/Branding/main/logos/transparent/256/bot_logo.png" alt="CompliBot" align="right" height="256px">
<div align="center">
  <h1>CompliBot</h1>
  <h3>The official bot of all Faithful Resource Pack discords</h3>

![RepoSize](https://img.shields.io/github/repo-size/Faithful-Resource-Pack/Discord-Bot)
![Issues](https://img.shields.io/github/issues/Faithful-Resource-Pack/Discord-Bot)
![PullRequests](https://img.shields.io/github/issues-pr/Faithful-Resource-Pack/Discord-Bot)
[![Crowdin](https://badges.crowdin.net/e/1602cfd1a52793da79736586c4493097/localized.svg)](https://faithful.crowdin.com/discord-bot)
</div>

___

### Online on

- [Faithful 32x](https://discord.gg/sN9YRQbBv7)
- [Faithful 64x](https://discord.gg/Tqtwtgh)
- [Faithful Extras](https://discord.gg/qVeDfZw)

___

### Found an issue?

Please submit it using our [bug tracker](https://github.com/Faithful-Resource-Pack/Discord-Bot/issues/new/choose) or by using the `/feedback <text>` command from the bot. The bug tracker is preferred but both options are valid.
___

### Installation and launching

1. Install **[Node.js](https://nodejs.org/)** on your machine. **Version 16.9.0 or higher is required!**
2. Clone the repository on your machine.
3. Open your console in the cloned repository.
4. To complete the installation, write the following command in the console:

```bash
pnpm install
```

5. After installation, you will need to **[configure the bot](#bot-config)**.
6. To start the bot, write the following command in the console:

```bash
pnpm run dev
```

---

### Repository configuration

As we try our best to keep the branches history clean, we've set up some "settings" on the branches management; all changes needs to be first developed trough a feature specific branch, then reviewed & merged in the `ts-dev` branch, then once in a while we push all changes to the `typescript` branch (which is the one that is used by the official Discord client).

|    Branch    | Version | Protected | Used for                | Description                                        |
|:------------:|:--------|:---------:|:------------------------|----------------------------------------------------|
| `typescript` | v2.x    |    yes    | CompliBot (TS)          | stable & public version of the bot                 |
|   `ts-dev`   | v2.x.x  |     -     | CompliBot Nightly (TS)  | experimental & private version of the bot          |
| `ts-dev-v3`  | v3.x    |     -     |                         | very experimental version & rewrite of the v2 & v1 |
| `javascript` | v1.x    |     -     | CompliBot               | first version of the bot, public                   |
|  `crowdin`   | -       |     -     | Crowdin translation     |                                                    |
|  `I10n_ts`   | -       |     -     | Crowdin translation PRs |                                                    |

___

### Bot configuration

> **Warning**  
> We won't help you re-branding the bot for any other server. If you really want to do that, then you need to figure it out yourself.

1. Create an app on the **[Discord Developer Portal](https://discord.com/developers/)**.
2. Go to the **Bot** tab, create a bot and copy its token.
3. Create a file named `tokens.json` in the `json` repository (or copy + rename the `tokens.json.example`).
4. Fill all field following this format:

```jsonc
{
  "prefix": "/", // bot prefix for old commands (will be removed in the future)
  "firestormToken": "", // token of the Firestorm database (see below for instruction on how to get it)
  "token": "", // token of the bot, from the Discord Developer Portal
  "appID": "", // "userId" of the bot app
  "apiPassword": "", // token access for private API calls
  "errorChannel": "", // channel ID where to send error messages
  "dev": boolean, // set to true to enable developer mode
  "verbose": boolean, // set to true to enable verbose mode
  "maintenance": boolean, // set to true to enable maintenance mode
}
```

> **Note**  
> See `config.json` for general public config.

### Firestorm

This project is heavily developed around the self hosted Firestore-like database: [firestorm-db](https://github.com/TheRolfFR/firestorm-db). Feel free to check the repository of that library to easily understand how it works.
