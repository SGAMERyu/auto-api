import { $fetch } from "ohmyfetch";
import {
  ApiInterface,
  GroupApiInterface,
  NORMALIZE_RESPONSE,
  NORMALIZE_TYPE,
} from "./types";
import { normalize } from "./utils/normalize";
import { Project, StructureKind } from "ts-morph";
import { createInterfaceFolder } from "./core/createFile";

const url = "";

const config = {
  groups: [
    {
      name: "channel",
      comment: "客户端-服务商相关",
      apiPrefix: /^\/api\/channel\//,
    },
    {
      name: "solution",
      comment: "客户端-服务商相关",
      apiPrefix: /^\/api\/solution\//,
    },
  ],
};

async function startup(type: NORMALIZE_TYPE) {
  const data = await $fetch<NORMALIZE_RESPONSE>(url);
  const apiGroup = normalize(type, data, config) || [];
  createInterfaceFolder(apiGroup);
}

startup(NORMALIZE_TYPE.SWAGGER);
