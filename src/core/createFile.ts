import { Project } from "ts-morph";
import { GroupApiInterface } from "../types";

const project = new Project();

export function createInterfaceFolder(apiGroup: GroupApiInterface[]) {
  apiGroup.forEach((api) => {
    const sourceFile = project.createSourceFile(`service/${api.name}.ts`, "hello world");
    sourceFile.saveSync();
  });
}
