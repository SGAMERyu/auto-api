import chalk from "chalk";
import {
  NORMALIZE_TYPE,
  NORMALIZE_RESPONSE,
  SwaggerApiResponse,
  Definition,
  SwaggerApiData,
  ApiInterface,
  GroupApiInterface,
  Schema,
  ApiGroup,
  SwaggerResponses,
  SwaggerParameters,
  Request,
  SWAGGER_DATA_TYPE_TO_TS_TYPE,
  Response,
} from "../types";
import { log } from "./log";

export function normalizeSwagger(data: SwaggerApiResponse, groups: ApiGroup[]) {
  const { paths, definitions } = data;

  const serviceGroup: GroupApiInterface[] = groups.map((group) => {
    const { name, description } = group;
    let apiList: ApiInterface[] = [];
    let publicDependencyInterface: Set<Schema> = new Set();
    for (const [path, apiData] of Object.entries(paths)) {
      let patten = group.apiPrefix;
      if (typeof group.apiPrefix === "string") {
        patten = new RegExp(patten, "g");
      }
      if (patten.test(path)) {
        const { apiDataList, apiDependentInterface } = generateApiData(
          path,
          apiData
        );
        apiList = apiList.concat(apiDataList);
        publicDependencyInterface = new Set([
          ...publicDependencyInterface,
          ...apiDependentInterface,
        ]);
      }
    }
    return {
      name,
      description,
      apiList,
      publicDependencyInterface,
    };
  });

  function generateApiData(url: string, apiData: SwaggerApiData) {
    const apiDataList: ApiInterface[] = [];
    let apiDependentInterface: Set<Schema> = new Set();
    // 遍历api数据中的http method，通常来说应该只有一个http method
    for (const [method, data] of Object.entries(apiData)) {
      // 获取200返回结果
      const { parameters, responses } = data;
      const { request, publicDependencyInterface: requestInterface } =
        generateRequestInterface(parameters || []);
      const { response, publicDependencyInterface: responseInterface } =
        generateResponseInterface(responses);

      apiDependentInterface = new Set([
        ...requestInterface,
        ...responseInterface,
      ]);

      apiDataList.push({
        url,
        method,
        description: data.summary,
        request,
        response,
      });
    }

    return { apiDataList, apiDependentInterface };
  }

  // 从definition 获取对应的interfaceData
  function generateInterfaceFromSwaggerDefinition(
    interfaceData: Definition,
    dep: Set<Schema> = new Set()
  ) {
    const { properties } = interfaceData;
    Object.keys(properties).forEach((key) => {
      const { schema, items, $ref } = properties[key];
      // 引用的definition对象
      const schemaRef = schema?.$ref || items?.$ref || $ref;
      if (schemaRef) {
        const { interfaceName, interfaceData } =
          getInterfaceFromDefinition(schemaRef);
        Reflect.set(properties[key], "refType", interfaceName);
        generateInterfaceFromSwaggerDefinition(interfaceData, dep);
      } else if (items && items.type) {
        Reflect.set(properties[key], "refType", `${items.type}`);
      }
    });
    dep.add(interfaceData as any);
    return dep;
  }

  function generateResponseInterface(responseData: SwaggerResponses) {
    let newResponse: Response = { type: "any", noExport: true };
    const publicDependencyInterface: Set<Schema> = new Set();
    const { schema } = responseData[200];
    const schemaRef = schema?.$ref || schema?.items?.$ref;
    if (!schemaRef) return { response: newResponse, publicDependencyInterface };
    const { interfaceData, interfaceName } =
      getInterfaceFromDefinition(schemaRef);
    newResponse = { type: interfaceName };
    generateInterfaceFromSwaggerDefinition(
      interfaceData,
      publicDependencyInterface
    );
    return { response: newResponse, publicDependencyInterface };
  }

  function generateRequestInterface(parameters: SwaggerParameters[]) {
    const publicDependencyInterface: Set<Schema> = new Set();
    const request: Request = {
      body: null,
      query: null,
      path: [],
    };
    parameters.forEach((parameter) => {
      const { in: type, schema } = parameter;
      if (type === "body" && schema?.$ref) {
        const { interfaceData, interfaceName } = getInterfaceFromDefinition(
          schema.$ref
        );
        request.body = { type: interfaceName };
        generateInterfaceFromSwaggerDefinition(
          interfaceData,
          publicDependencyInterface
        );
      } else if (type === "path") {
        request.path.push({
          ...parameter,
          type: SWAGGER_DATA_TYPE_TO_TS_TYPE[parameter.type],
        });
      } else if (type === "query") {
        //
      }
    });

    return { request, publicDependencyInterface };
  }
  // 获取interface name 从swagger中的data里面
  function getInterfaceFromDefinition(ref: string) {
    // 获取definitions定义的model类型名字
    const name = ref.split("/").pop()!;
    // 获取最终的definitions的命名
    const interfaceName = name.replace(/«|»|,/g, "");

    // 获取真实数据
    const interfaceData = Reflect.get(definitions, name) as Definition;
    Reflect.set(interfaceData, "title", interfaceName);

    return { interfaceData, interfaceName };
  }

  return serviceGroup;
}

export function normalize(
  type: NORMALIZE_TYPE,
  response: NORMALIZE_RESPONSE,
  groups: ApiGroup[]
) {
  if (type === NORMALIZE_TYPE.SWAGGER) {
    return normalizeSwagger(response, groups);
  }
}
