import { ApiInterface, HTTP_METHODS } from "../types";
import camelCase from "camelcase";
import {
  FunctionDeclarationStructure,
  OptionalKind,
  ParameterDeclarationStructure,
} from "ts-morph";
import { withQuery } from "ufo";
import { convertPathsToString } from "../utils";
import { Request } from "../types/index";

const POST_VUE_QUERY = [
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
];

const GET_VUE_QUERY = [
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
];

function hasRequestQueryParams(request: Request | undefined) {
  return request?.body || request?.path?.length || request?.query?.length;
}

function getQueryType(request: Request | undefined) {
  return hasRequestQueryParams(request)
    ? `{
      ${
        request?.query?.length
          ? `query: ${convertPathsToString(request.query)}`
          : ""
      }
      ${
        request?.path?.length
          ? `path: ${convertPathsToString(request.path)}`
          : ""
      }
      ${
        request?.body
          ? `data: Ref<${request.body.type}> | ${request.body.type}`
          : ""
      }
  }`
    : "any";
}

function createGetApi(
  requestName: string,
  request: Request | undefined,
  requestUrl: string
) {
  return `return useQuery<T>(['${requestName}', ${
    hasRequestQueryParams(request)
      ? `
          ${request?.body ? "body.data," : ""}
          ${request?.path.length ? "body.path," : ""}
          ${request?.query.length ? "body.query," : ""}
        `
      : ""
  }], () => fetch.get(${requestUrl}, ...restOptions) as Promise<T>, options)`;
}

function createPostApi(requestUrl: string, request: Request | undefined) {
  const { body: requestBody } = request || {};
  const isHaveVariables = hasRequestQueryParams(request);
  return `return useMutation<TData, TError, TVariables, TContext>((
    ${isHaveVariables ? `body: any,` : ""}) => fetch.post(${requestUrl} ${
    requestBody ? ",unref(body.data)" : ""
  },  ...restOptions) as Promise<TData>, options)`;
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
  let requestUrl = url;
  const queryName = camelCase(
    `use-${method}-${plainUrl.replace(/\//g, "-")}-Query`
  );
  const requestName = camelCase(`${method}-${plainUrl.replace(/\//g, "-")}`);

  const { vueQueryParameters } = createVueQueryParameters(
    method as HTTP_METHODS
  );
  const typeParameters = createTypeParameters(method as HTTP_METHODS);
  const statements = createStatement(method as HTTP_METHODS);

  function createVueQueryParameters(method: HTTP_METHODS) {
    let vueQueryParameters: OptionalKind<ParameterDeclarationStructure>[] = [];
    const requestParameters: OptionalKind<ParameterDeclarationStructure>[] = [];
    const queryParameters: OptionalKind<ParameterDeclarationStructure>[] = [];

    if (request?.body && method === HTTP_METHODS.GET) {
      requestParameters.push({ name: "body", type: request.body.type });
    }
    if (request?.path) {
      request.path.forEach(({ name, type }) => {
        requestParameters.push({ name, type: `Ref<${type}> | ${type}` });
        requestUrl = `${requestUrl.replaceAll(
          `{${name}}`,
          "${" + `unref(body?.path?.${name})` + "}"
        )}`;
      });
    }
    if (request?.query) {
      const queryMap: Record<string, string> = {};
      request.query.forEach(({ name, type }) => {
        queryParameters.push({ name, type: `Ref<${type}> | ${type}` });
        Reflect.set(queryMap, name, "${" + `unref(body?.query?.${name})` + "}");
      });
      requestUrl = withQuery(requestUrl, queryMap);
    }
    requestUrl = `\`${requestUrl}\``;
    const getQueryParameters = [
      {
        name: "body",
        type: getQueryType(request),
      },
    ];
    vueQueryParameters = vueQueryParameters.concat(queryParameters);
    switch (method) {
      case HTTP_METHODS.GET:
        vueQueryParameters = getQueryParameters.concat(GET_VUE_QUERY);
        break;
      case HTTP_METHODS.POST:
        vueQueryParameters = POST_VUE_QUERY;
        break;
    }

    return { vueQueryParameters };
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
            default: getQueryType(request),
          },
          { name: "TData", default: response.type },
          { name: "TError", default: "unknown" },
          { name: "TContext", default: "unknown" },
        ];
      default:
        return [{ name: "T", default: response.type }];
    }
  }

  function createStatement(method: HTTP_METHODS) {
    switch (method) {
      case HTTP_METHODS.GET:
        return createGetApi(requestName, request, requestUrl);
      case HTTP_METHODS.POST:
        return createPostApi(requestUrl, request);
    }
  }

  return {
    name: queryName,
    parameters: vueQueryParameters,
    typeParameters,
    statements,
  };
}
