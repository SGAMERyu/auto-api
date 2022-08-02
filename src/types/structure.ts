import { HTTP_METHODS } from "./operation";

export interface GroupApiInterface {
  comment: string;
  name: string;
  apiList?: ApiInterface[];
}

export interface ApiInterface {
  // 路径
  url: string;
  // 方法
  method: HTTP_METHODS | string;
  // 接口介绍
  comment?: string;
  // 请求参数
  request?: {
    query: RequestQuery;
    path: RequestPath;
    body: Schema;
  };
  // 响应参数
  response: Schema;
}

export interface RequestQuery {
  type: string;
  title: string;
  required?: boolean;
}
export interface RequestPath {
  type: string;
  title: string;
  required?: boolean;
}

export interface Schema {
  // 类型
  type: string;
  // 名称
  title?: string;
  // 注释
  comment?: string;
  required?: boolean;
  properties?: {
    [name in string]: Schema;
  };
}
