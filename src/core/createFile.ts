import { Project } from "ts-morph";
import { resolve } from "path";
import { upperFirst } from "scule";
import {
  Config,
  GroupApiInterface,
  ImportModule,
  SWAGGER_DATA_TYPE,
  SWAGGER_DATA_TYPE_LIST,
  SWAGGER_DATA_TYPE_TO_TS_TYPE,
  templateImportMap,
} from "../types";
import { createVueQueryTemplate } from "../template";

const project = new Project();

export function createInterfaceFolder(
  apiGroup: GroupApiInterface[],
  output: string
) {
  const filePath = resolve(process.cwd(), `${output}`);
  apiGroup.forEach((api) => {
    const { publicDependencyInterface, name, description } = api;
    const sourceFile = project.createSourceFile(
      `${filePath}/${name}/interface.ts`,
      `// ${description}`,
      { overwrite: true }
    );

    publicDependencyInterface.forEach((interfaceData) => {
      try {
        const { title } = interfaceData;
        const interfaceDeclaration = sourceFile
          .addInterface({ name: title! })
          .setIsExported(true);
        for (const [name, value] of Object.entries(
          interfaceData.properties || {}
        )) {
          const { refType, type, enum: enums, items } = value;
          let propertyItemType = SWAGGER_DATA_TYPE_TO_TS_TYPE[type] || refType;
          if (
            [SWAGGER_DATA_TYPE.ARRAY, SWAGGER_DATA_TYPE.OBJECT].includes(
              type as SWAGGER_DATA_TYPE
            )
          ) {
            if (type === SWAGGER_DATA_TYPE.OBJECT) {
              propertyItemType = refType || "Record<string, any>";
            }
            if (type === SWAGGER_DATA_TYPE.ARRAY) {
              const type =
                items?.$ref?.split("/").pop()!.replace(/«|»|,/g, "") ||
                items?.type;

              propertyItemType = type
                ? `${
                    SWAGGER_DATA_TYPE_LIST.includes(type)
                      ? `${SWAGGER_DATA_TYPE_TO_TS_TYPE[type]}[]`
                      : `${type}[]`
                  }`
                : "any[]";
            }
          }

          // 如果是枚举
          if (enums) {
            const newEnums = [...new Set(enums)];
            propertyItemType = `${upperFirst(title!)}${upperFirst(name)}Enum`;
            if (
              newEnums.some(
                (item) =>
                  typeof Number(item) === "number" &&
                  !Number.isNaN(Number(item))
              )
            ) {
              sourceFile.addTypeAlias({
                name: propertyItemType,
                type: enums.join("|"),
              });
            } else {
              const members = newEnums.map((item) => {
                return { name: item.toString(), value: item };
              });
              // console.log(members)
              sourceFile
                .addEnum({
                  name: propertyItemType,
                  members,
                  isConst: true,
                })
                .setIsExported(true);
            }
          }

          interfaceDeclaration.addProperty({
            name,
            type: propertyItemType,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });

    sourceFile.saveSync();
  });
}

export function createServiceFolder(
  apiGroup: GroupApiInterface[],
  config: Config
) {
  const { importList, output, template } = config;
  const importDeclarationList: ImportModule[] = importList.concat(
    templateImportMap[template] as any
  );
  const filePath = resolve(process.cwd(), `${output}`);
  apiGroup.forEach(({ name, apiList }) => {
    // 可能会有相同的引用，因此需要去重
    const importTypeList: Set<string> = new Set();
    const sourceFile = project.createSourceFile(
      `${filePath}/${name}/request.ts`,
      "",
      { overwrite: true }
    );
    importDeclarationList.forEach(
      ({ namedImports, moduleSpecifier, defaultImport }) => {
        sourceFile.addImportDeclaration({
          defaultImport,
          namedImports,
          moduleSpecifier,
        });
      }
    );
    apiList?.forEach((apiData) => {
      const { description, response, request } = apiData;
      response.type && !response?.noExport && importTypeList.add(response.type);
      request?.body?.type && importTypeList.add(request.body.type);
      description && sourceFile.addStatements(`// ${description}`);
      sourceFile
        .addFunction(createVueQueryTemplate(apiData))
        .setIsExported(true);
    });
    sourceFile.addImportDeclaration({
      namedImports: [...importTypeList],
      moduleSpecifier: "./interface",
    });
    sourceFile.saveSync();
  });
}
