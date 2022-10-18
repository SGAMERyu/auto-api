import { $fetch } from "ohmyfetch";
import chalk from "chalk";
import { Config, DEFAULT_CLI_CONFIG, NORMALIZE_RESPONSE } from "./types";
import { normalize } from "./utils/normalize";
import { createInterfaceFolder, createServiceFolder } from "./core/createFile";
import { getAutoApiJson } from "./utils/fs";
import { log } from "./utils";
import merge from "lodash.merge";

async function startup() {
  try {
    let config: Config = getAutoApiJson();
    config = Object.assign(DEFAULT_CLI_CONFIG, config);
    const { url, type, groups, output, onlyInterface } = config;
    const data = await fetchRawData(url);
    log(chalk.blue("start normalize api data"));
    const apiGroup = normalize(type, data, groups);
    log(chalk.green("normalize api data is finish"));
    createInterfaceFolder(apiGroup || [], output);
    // if (!onlyInterface) {
    //   createServiceFolder(apiGroup || [], config);
    //   log(chalk.green("generate api success"));
    // }
  } catch (error) {
    log(chalk.red(error));
  }
}

async function fetchRawData(url: string | string[]) {
  log(chalk.blue("start fetch Api Data..."));
  let data: Partial<NORMALIZE_RESPONSE> = {};
  if (typeof url === "string") {
    data = await $fetch<NORMALIZE_RESPONSE>(url);
  } else if (Array.isArray(url)) {
    const responseList = await Promise.allSettled(
      url.map((item) => $fetch<NORMALIZE_RESPONSE>(item))
    );
    responseList.forEach((response) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (response.status === "fulfilled") {
        data = merge(data, response.value);
      }
    });
  }
  log(chalk.green("fetch Api is success"));

  return data as NORMALIZE_RESPONSE;
}

startup();
