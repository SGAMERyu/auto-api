import { ApiInterface, HTTP_METHODS, RequestPath } from "../types";
import camelCase from "camelcase";
import {
  FunctionDeclarationStructure,
  OptionalKind,
  ParameterDeclarationStructure,
} from "ts-morph";
import { convertPathsToString } from "../utils";

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

function createPostApi(
  requestUrl: string,
  paths: RequestPath[],
  requestBody?: any
) {
  const path = convertPathsToString(paths);
  return `return useMutation<TData, TError, TVariables, TContext>((
    ${
      requestBody || path
        ? `body: {
     ${path ? `path?: ${path},` : ""}
      data?: TVariables
    }`
        : ""
    }) => fetch.post(${requestUrl} ${
    requestBody ? ",body.data" : ""
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
          if (method === HTTP_METHODS.GET) {
            requestParameters.push({ name, type: `Ref<${type}> | ${type}` });
            requestUrl = `\`${url.replaceAll(
              `{${name}}`,
              "${" + `unref(${name})` + "}"
            )}\``;
          }
          if (method === HTTP_METHODS.POST) {
            requestUrl = `\`${url.replaceAll(
              `{${name}}`,
              "${" + `unref(body?.path?.${name})` + "}"
            )}\``;
          }
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
        return [
          {
            name: "T",
            default: response.isArray ? `${response.type}[]` : response.type,
          },
        ];
      case HTTP_METHODS.POST:
        return [
          {
            name: "TVariables",
            default: `{
            path?: ${convertPathsToString(request?.path || []) || "void"}
            data?: ${request?.body?.type || "void"} 
          }`,
          },
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
        return createGetApi(
          requestName,
          requestParameters,
          requestUrl,
          request?.body
        );
      case HTTP_METHODS.POST:
        return createPostApi(requestUrl, request?.path || [], request?.body);
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
