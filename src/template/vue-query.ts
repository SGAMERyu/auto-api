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
  }, ...restOptions) as Promise<T>, options)`;
}

function createPostApi(requestUrl: string, body?: any) {
  return `return useMutation<TData, TError, TVariables, TContext>((${
    body ? "body" : ""
  }) => fetch.post(${requestUrl} ${
    body ? ",body" : ""
  }, ...restOptions) as Promise<TData>, options)`;
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

  const { vueQueryParameters, requestParameters } = createVueQueryParameters(
    method as HTTP_METHODS
  );
  const typeParameters = createTypeParameters(method as HTTP_METHODS);
  const statements = createStatement(method as HTTP_METHODS, requestParameters);

  function createVueQueryParameters(method: HTTP_METHODS) {
    let vueQueryParameters: OptionalKind<ParameterDeclarationStructure>[] = [];
    const requestParameters: OptionalKind<ParameterDeclarationStructure>[] = [];
    if (request) {
      if (request.body && method === HTTP_METHODS.GET) {
        requestParameters.push({ name: "body", type: request.body.type });
      }
      if (request.path) {
        request.path.forEach(({ name, type }) => {
          requestParameters.push({ name, type });
          requestUrl = `\`${url.replaceAll(`{${name}}`, "${" + name + "}")}\``;
        });
      }
    }

    switch (method) {
      case HTTP_METHODS.GET:
        vueQueryParameters = requestParameters.concat([
          {
            name: "options",
            type: `UseQueryOptions<T>`,
            initializer: "{}",
          },
          {
            name: "restOptions",
            type: "any[]",
            isRestParameter: true,
          },
        ]);
        break;
      case HTTP_METHODS.POST:
        vueQueryParameters = requestParameters.concat([
          {
            name: "options",
            type: `UseMutationOptions<TData, TError, TVariables, TContext>`,
            initializer: "{}",
          },
          {
            name: "restOptions",
            type: "any",
            isRestParameter: true,
          },
        ]);

        break;
    }
    return { vueQueryParameters, requestParameters };
  }

  function createTypeParameters(method: HTTP_METHODS) {
    switch (method) {
      case HTTP_METHODS.GET:
        return [{ name: "T", default: response.type }];
      case HTTP_METHODS.POST:
        return [
          { name: "TVariables", default: "void" },
          { name: "TData", default: response.type },
          { name: "TError", default: "unknown" },
          { name: "TContext", default: "unknown" },
        ];
      default:
        return [{ name: "T", default: response.type }];
    }
  }

  function createStatement(
    method: HTTP_METHODS,
    requestParameters: OptionalKind<ParameterDeclarationStructure>[]
  ) {
    switch (method) {
      case HTTP_METHODS.GET:
        return createGetApi(requestName, requestParameters, requestUrl, request?.body);
      case HTTP_METHODS.POST:
        return createPostApi(requestUrl, request?.body);
      default:
        return `return useQuery<T>(['${requestName}', ${requestParameters
          .map((item) => item.name)
          .join(",")}], () => fetch.${method}(${requestUrl} ${
          request?.body ? ",body" : ""
        }) as Promise<T>, options)`;
    }
  }

  return {
    name: queryName,
    parameters: vueQueryParameters,
    typeParameters,
    statements,
  };
}
