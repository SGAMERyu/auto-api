import { ApiInterface } from "../types";
import camelCase from "camelcase";
import { FunctionDeclarationStructure, OptionalKind } from "ts-morph";

export function createVueQueryTemplate(
  api: ApiInterface
): OptionalKind<FunctionDeclarationStructure> {
  const { url, method, response, request } = api;
  const plainUrl = url.replace(/[{}]/g, "");
  let requestUrl = `"${url}"`;
  const queryName = camelCase(
    `use-${method}-${plainUrl.replace(/\//g, "-")}-Query`
  );
  const requestName = camelCase(`${method}-${plainUrl.replace(/\//g, "-")}`);
  const parameters = [];
  if (request) {
    request.body && parameters.push({ name: "body", type: request.body.type });
    request.path &&
      request.path.forEach(({ name, type }) => {
        parameters.push({ name, type });
        requestUrl = `\`${url.replace(`{${name}}`, "${" + name + "}")}\``;
      });
  }

  return {
    name: queryName,
    parameters,
    statements: `return useQuery<${
      response.type
    }>(['${requestName}', ${parameters
      .map((item) => item.name)
      .join(",")}], () => fetch.${method}(${requestUrl} ${
      request?.body ? ",body" : ""
    }))`,
  };
}
