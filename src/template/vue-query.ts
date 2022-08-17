import { ApiInterface, HTTP_METHODS } from "../types";
import camelCase from "camelcase";
import {
  FunctionDeclarationStructure,
  OptionalKind,
  ParameterDeclarationStructure,
} from "ts-morph";

function createGetApi(
  requestName: string,
  parameters: OptionalKind<ParameterDeclarationStructure>[],
  requestUrl: string,
  body?: any
) {
  return `return useQuery<T>(['${requestName}', ${parameters
    .map((item) => item.name)
    .join(",")}], () => fetch.get(${requestUrl} ${
    body ? ",body" : ""
  }) as Promise<T>, options)`;
}

function createPostApi(requestUrl: string, body?: any) {
  return `return useMutation<TData, TError, TVariables, TContext>(() => fetch.post(${requestUrl} ${
    body ? ",body" : ""
  }) as Promise<TData>, options)`;
}

export function createVueQueryTemplate(
  api: ApiInterface
): OptionalKind<FunctionDeclarationStructure> {
  const { url, method, response, request } = api;
  let addFromPathFlag = false;
  const plainUrl = url.replace(/{(.*?)}/g, (matchers, $1: string) => {
    if (!addFromPathFlag) {
      addFromPathFlag = true;
      return `From${camelCase($1, {
        pascalCase: true,
        preserveConsecutiveUppercase: true,
      })}`;
    }

    return $1;
  });
  let requestUrl = `"${url}"`;
  const queryName = camelCase(
    `use-${method}-${plainUrl.replace(/\//g, "-")}-Query`
  );
  const requestName = camelCase(`${method}-${plainUrl.replace(/\//g, "-")}`);

  const parameters = createParameters(method as HTTP_METHODS);
  const typeParameters = createTypeParameters(method as HTTP_METHODS);
  const statements = createStatement(method as HTTP_METHODS);

  function createParameters(method: HTTP_METHODS) {
    const parameters: OptionalKind<ParameterDeclarationStructure>[] = [];
    if (request) {
      if (request.body) {
        parameters.push({ name: "body", type: request.body.type });
      }
      if (request.path) {
        request.path.forEach(({ name, type }) => {
          parameters.push({ name, type });
          requestUrl = `\`${url.replaceAll(`{${name}}`, "${" + name + "}")}\``;
        });
      }
    }

    switch (method) {
      case HTTP_METHODS.GET:
        parameters.push({
          name: "options",
          type: `UseQueryOptions<T>`,
          initializer: "{}",
        });
        break;
      case HTTP_METHODS.POST:
        parameters.push({
          name: "options",
          type: `UseMutationOptions<TData, TError, TVariables, TContext>`,
          initializer: "{}",
        });
        break;
    }
    return parameters;
  }

  function createTypeParameters(method: HTTP_METHODS) {
    switch (method) {
      case HTTP_METHODS.GET:
        return [{ name: "T", default: response.type }];
      case HTTP_METHODS.POST:
        return [
          { name: "TData", default: response.type },
          { name: "TError", default: "unknown" },
          { name: "TVariables", default: "void" },
          { name: "TContext", default: "unknown" },
        ];
      default:
        return [{ name: "T", default: response.type }];
    }
  }

  function createStatement(method: HTTP_METHODS) {
    switch (method) {
      case HTTP_METHODS.GET:
        return createGetApi(requestName, parameters, requestUrl, request?.body);
      case HTTP_METHODS.POST:
        return createPostApi(requestUrl, request?.body);
      default:
        return `return useQuery<T>(['${requestName}', ${parameters
          .map((item) => item.name)
          .join(",")}], () => fetch.${method}(${requestUrl} ${
          request?.body ? ",body" : ""
        }) as Promise<T>, options)`;
    }
  }

  return {
    name: queryName,
    parameters,
    typeParameters,
    statements,
  };
}
