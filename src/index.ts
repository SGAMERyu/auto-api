import { $fetch } from "ohmyfetch";
import chalk from "chalk";
import { Config, DEFAULT_CLI_CONFIG, NORMALIZE_RESPONSE } from "./types";
import { normalize } from "./utils/normalize";
import { createInterfaceFolder, createServiceFolder } from "./core/createFile";
import { getAutoApiJson } from "./utils/fs";
import { log } from "./utils";

async function startup() {
  try {
    let config: Config = getAutoApiJson();
    config = Object.assign(DEFAULT_CLI_CONFIG, config);
    const { url, type, groups, output } = config;
    log(chalk.blue("start fetch Api Data..."));
    const data = await $fetch<NORMALIZE_RESPONSE>(url);
    log(chalk.green("fetch Api is success"));
    log(chalk.blue("start normalize api data"));
    const apiGroup = normalize(type, data, groups);
    log(chalk.green("normalize api data is finish"));
    createInterfaceFolder(apiGroup || [], output);
    createServiceFolder(apiGroup || [], config);
    log(chalk.green("generate api success"));
  } catch (error) {
    console.log(error);
    log(chalk.red(error));
  }
}

startup();
