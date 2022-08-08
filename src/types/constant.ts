import { Config } from ".";
import { SwaggerApiResponse } from "./swagger";

export enum NORMALIZE_TYPE {
  SWAGGER = "SWAGGER",
}
export enum TEMPLATE_TYPE {
  VUE_QUERY = "vue_query",
}
export type NORMALIZE_RESPONSE = SwaggerApiResponse;

export const DEFAULT_CLI_CONFIG: Config = {
  groups: [],
  url: "",
  output: "service",
  type: NORMALIZE_TYPE.SWAGGER,
  importList: [],
  template: TEMPLATE_TYPE.VUE_QUERY,
};
