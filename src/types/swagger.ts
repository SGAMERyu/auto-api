import { HTTP_METHODS, HTTP_STATUS_CODE, PARAMS_TYPE } from "./operation";

export type URL = string;
export type Version = string;

export interface SwaggerApiResponse {
  // 元数据
  info: Info;
  // swagger 版本
  swagger: Version;
  // 服务根路径
  host?: URL;
  // 基本路径
  basePath?: string;
  // 接口 model定义
  definitions: Definitions;
  // api 请求列表
  paths: Record<string, SwaggerApiData>;
  // 分组接口
  tags: Tag[];
}

export interface Info {
  // 标题
  title: string;
  // 简短描述
  description: string;
  termsOfService: string;
  // 联系方式
  Contact: Contact;
  version: Version;
}

export interface Contact {
  name: string;
  url: string;
  email: string;
}

export interface Tag {
  // 接口分类名称
  name: string;
  // 接口描述
  description: string;
  [key: string]: unknown;
}

export type SwaggerApiData = {
  [key in HTTP_METHODS]: SwaggerPath;
};

export interface SwaggerPath {
  tags?: string[];
  summary?: string;
  parameters?: SwaggerParameters[];
  responses: SwaggerResponses;
}

export interface Definitions {
  [key: string]: Definition;
}

export interface Definition {
  description: string;
  properties: Properties;
  title: string;
  type: string;
}

export type Properties = {
  [name in string]: {
    type: string;
    title: string;
    description: string;
    items?: { $ref: string };
    schema?: { $ref: string }
  };
};

export interface SwaggerParameters {
  name: string;
  in: PARAMS_TYPE;
  required?: boolean;
  description?: string;
  // 类型
  type: string;
}

export type SwaggerResponses = {
  [key in HTTP_STATUS_CODE]: {
    description: string;
    schema: {
      $ref: string;
    };
  };
};
