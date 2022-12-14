import { NORMALIZE_TYPE, TEMPLATE_TYPE } from ".";

export interface Config {
  // 分组
  groups: ApiGroup[];
  // 获取json地址
  url: string | string[];
  // 文件输出位置
  output: string;
  // 文件源类型
  type: NORMALIZE_TYPE;
  // 引入类型
  importList: ImportModule[];
  // api模板类型
  template: TEMPLATE_TYPE;
  onlyInterface: boolean;
}

export interface ImportModule {
  namedImports: string[];
  defaultImport?: string;
  moduleSpecifier: string;
}

export interface ApiGroup {
  name: string;
  description: string;
  apiPrefix: RegExp;
}

export const DEFAULT_CLI_CONFIG: Config = {
  groups: [],
  url: "",
  output: "service",
  type: NORMALIZE_TYPE.SWAGGER,
  importList: [],
  template: TEMPLATE_TYPE.VUE_QUERY,
  onlyInterface: false,
};
