import { resolve } from "path";
import fs from "fs";

export function getAutoApiJson(cwd = process.cwd()): any {
  const path = resolve(cwd, "auto-api.json");
  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, "utf-8");
      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      console.warn("Failed to parse package.json");
      process.exit(0);
    }
  }
}

export function getTestJson(cwd = process.cwd()): any {
  const path = resolve(cwd, "swagger.json");
  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, "utf-8");
      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      console.warn("Failed to parse package.json");
      process.exit(0);
    }
  }
}
