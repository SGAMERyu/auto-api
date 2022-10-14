import { HTTP_METHODS } from "./operation";

export interface GroupApiInterface {
  // 分组api 描述
  description: string;
  // 分组api 的命名
  name: string;
  // 分组api的list
  apiList?: ApiInterface[];
  // api的所有依赖
  publicDependencyInterface: Set<Schema>;
}

export interface ApiInterface {
  // 路径
  url: string;
  // 方法
  method: HTTP_METHODS | string;
  // 接口介绍
  description?: string;
  // 请求参数
  request?: Request;
  // 响应参数
  response: Response;
}

export interface Request {
  query: RequestQuery[];
  path: RequestPath[];
  body: { type: string } | null;
}

export interface RequestQuery {
  type: string;
  name: string;
  required?: boolean;
}

export interface RequestPath {
  type: string;
  name: string;
  required?: boolean;
}

export interface Response {
  type: string;
  noExport?: boolean;
  isArray?: boolean;
}

export interface Schema {
  // 类型
  type: string;
  // interface的名字
  title?: string;
  // 引用类型
  refType?: string;
  // 注释
  description?: string;
  required?: boolean;
  enum?: string[];
  properties?: {
    [name in string]: Schema;
  };
}
