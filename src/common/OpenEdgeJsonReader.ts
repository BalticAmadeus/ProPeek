import { IConfig } from "../view/app/model";

export function readFile(fileName: string): string {
  const fs = require("fs");
  const allFileContents = fs.readFileSync(fileName, "utf-8");

  return allFileContents;
}

export function getBuildPaths(fileContent: string) {
  const data = JSON.parse(fileContent);
  const { buildPath } = data;
  let configList: IConfig[] = [];

  let num = 0;

  const config: IConfig = {
    id: "local" + num,
    name: "blank",
    path: "**",
  };

  configList.push(config);

  buildPath.forEach((connection: { type: any; path: any }) => {
    const { type, path } = connection;
    num++;

    const config: IConfig = {
      id: "local" + num,
      name: type,
      path: path,
    };

    configList.push(config);
  });

  return configList;
}
