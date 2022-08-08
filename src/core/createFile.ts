import { Project, SyntaxKind } from "ts-morph";
import { resolve } from "path";
import {
  ApiInterface,
  Config,
  GroupApiInterface,
  ImportModule,
  SWAGGER_DATA_TYPE,
  SWAGGER_DATA_TYPE_TO_TS_TYPE,
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
      const { title } = interfaceData;
      const interfaceDeclaration = sourceFile
        .addInterface({ name: title! })
        .setIsExported(true);
      for (const [name, value] of Object.entries(
        interfaceData.properties || {}
      )) {
        const { refType, type, enum: enums } = value;
        let propertyItemType = SWAGGER_DATA_TYPE_TO_TS_TYPE[type] || refType;
        if (
          [SWAGGER_DATA_TYPE.ARRAY, SWAGGER_DATA_TYPE.OBJECT].includes(
            type as SWAGGER_DATA_TYPE
          )
        ) {
          propertyItemType =
            type === SWAGGER_DATA_TYPE.OBJECT ? refType! : `${refType!}[]`;
        }
        // 如果是枚举
        if (enums) {
          propertyItemType = `${title!.toUpperCase()}_${name.toUpperCase()}_ENUM`;
          const members = enums.map((item) => {
            return { name: item, value: item };
          });
          sourceFile
            .addEnum({
              name: propertyItemType,
              members,
            })
            .setIsExported(true);
        }

        interfaceDeclaration.addProperty({
          name,
          type: propertyItemType,
        });
      }
    });

    sourceFile.saveSync();
  });
}

export function createServiceFolder(
  apiGroup: GroupApiInterface[],
  config: Config
) {
  const { importList, output } = config;
  const filePath = resolve(process.cwd(), `${output}`);
  const importTypeList: string[] = [];
  apiGroup.forEach(({ name, apiList }) => {
    const sourceFile = project.createSourceFile(
      `${filePath}/${name}/request.ts`,
      "",
      { overwrite: true }
    );
    importList.forEach(({ namedImports, moduleSpecifier }) => {
      sourceFile.addImportDeclaration({
        namedImports,
        moduleSpecifier,
      });
    });
    apiList?.forEach((apiData) => {
      const { description, response, request } = apiData;
      importTypeList.push(response.type);
      request?.body?.type && importTypeList.push(request.body.type);
      description && sourceFile.addStatements(`// ${description}`);
      sourceFile
        .addFunction(createVueQueryTemplate(apiData))
        .setIsExported(true);
    });
    sourceFile.addImportDeclaration({
      namedImports: importTypeList,
      moduleSpecifier: "./interface",
    });
    sourceFile.saveSync();
  });
}
