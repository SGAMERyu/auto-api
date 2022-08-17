import { ApiInterface } from "../types";
import camelCase from "camelcase";
import {
  FunctionDeclarationStructure,
  OptionalKind,
  ParameterDeclarationStructure,
} from "ts-morph";

export function createVueQueryTemplate(
  api: ApiInterface
): OptionalKind<FunctionDeclarationStructure> {
  const { url, method, response, request } = api;
  const plainUrl = url.match(/[^{\\}]+(?=})/g);
  console.log(plainUrl);
  let requestUrl = `"${url}"`;
  const queryName = camelCase(
    `use-${method}-${plainUrl.replace(/\//g, "-")}-Query`
  );
  const requestName = camelCase(`${method}-${plainUrl.replace(/\//g, "-")}`);
  const parameters: OptionalKind<ParameterDeclarationStructure>[] = [];
  if (request) {
    request.body && parameters.push({ name: "body", type: request.body.type });
    request.path &&
      request.path.forEach(({ name, type }) => {
        parameters.push({ name, type });
        requestUrl = `\`${url.replaceAll(`{${name}}`, "${" + name + "}")}\``;
      });
  }

  parameters.push({
    name: "options",
    type: `UseQueryOptions<T>`,
    initializer: "{}",
  });

  return {
    name: queryName,
    parameters,
    typeParameters: [{ name: "T", default: response.type }],
    statements: `return useQuery<T>(['${requestName}', ${parameters
      .map((item) => item.name)
      .join(",")}], () => fetch.${method}(${requestUrl} ${
      request?.body ? ",body" : ""
    }) as Promise<T>, options)`,
  };
}
