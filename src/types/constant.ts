import { ImportDeclarationStructure, OptionalKind } from "ts-morph";
import { SwaggerApiResponse } from "./swagger";

export enum NORMALIZE_TYPE {
  SWAGGER = "SWAGGER",
}
export enum TEMPLATE_TYPE {
  VUE_QUERY = "vue-query",
}
export const templateImportMap: Record<
  string,
  OptionalKind<ImportDeclarationStructure>[]
> = {
  [TEMPLATE_TYPE.VUE_QUERY]: [
    {
      namedImports: [
        "useQuery",
        "UseQueryOptions",
        "useMutation",
        "UseMutationOptions",
      ],
      moduleSpecifier: "@tanstack/vue-query",
    },
    {
      namedImports: ["unref", "Ref"],
      moduleSpecifier: "vue",
    },
  ],
};
export type NORMALIZE_RESPONSE = SwaggerApiResponse;
