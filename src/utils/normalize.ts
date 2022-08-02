import {
  NORMALIZE_TYPE,
  NORMALIZE_RESPONSE,
  SwaggerApiResponse,
  Definition,
  SwaggerParameters,
  SwaggerResponses,
  Schema,
  Config,
  SwaggerApiData,
  ApiInterface,
  GroupApiInterface,
} from "../types";

export function normalizeSwagger(data: SwaggerApiResponse, config: Config) {
  const { paths, definitions } = data;
  const { groups } = config;
  const apiGroup: GroupApiInterface[] = groups.map((group) => {
    const { name, comment } = group;
    let apiList: ApiInterface[] = [];
    for (const [path, apiData] of Object.entries(paths)) {
      if (group.apiPrefix.test(path)) {
        const list = generateApiData(path, apiData);
        apiList = apiList.concat(list);
      }
    }
    return {
      name,
      comment,
      apiList,
    };
  });

  function generateApiData(url: string, apiData: SwaggerApiData) {
    const apiDataList: ApiInterface[] = [];
    for (const [method, data] of Object.entries(apiData)) {
      apiDataList.push({
        url,
        method,
        comment: data.summary,
        response: generateResponse(data.responses),
      });
    }
    return apiDataList;
  }

  function generateRequest(parameters: SwaggerParameters[] | undefined) {
    return undefined;
  }

  function generateResponse(responses: SwaggerResponses): Schema {
    if (!responses[200] || !responses[200].schema)
      return {
        type: "string",
      };

    return findDefinition(responses[200].schema.$ref);
  }

  function findDefinition(ref: string): Schema {
    const name = ref.split("/").pop()!;
    const definition = Reflect.get(definitions, name) as Definition;
    const { type, title, description, properties } = definition;
    const newProperties = Object.create(null) as Record<string, Schema>;
    Object.keys(properties).forEach((key) => {
      const { items, schema, type, title, description } = properties[key];
      const schemaRef = items || schema;
      newProperties[key] = schemaRef
        ? findDefinition(schemaRef.$ref)
        : {
            type,
            title,
            comment: description,
          };
    });
    return {
      type: type,
      title: title,
      comment: description,
      properties,
    };
  }

  return apiGroup;
}

export function normalize(
  type: NORMALIZE_TYPE,
  response: NORMALIZE_RESPONSE,
  config: Config
) {
  if (type === NORMALIZE_TYPE.SWAGGER) {
    return normalizeSwagger(response, config);
  }
}
