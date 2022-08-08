import { Definition } from "../types";

export function convertArrayToMap(
  arr: Record<string, unknown>[],
  label: string | ((val: Record<string, unknown>) => string),
  value: string | ((val: Record<string, unknown>) => unknown)
) {
  const map = Object.create(null) as Record<string, unknown>;
  arr.forEach((item) => {
    const key =
      typeof label === "function" ? label(item) : (item[label] as string);
    Reflect.set(
      map,
      key,
      typeof value === "function" ? value(item) : item[value]
    );
  });

  return map;
}

export function replaceTrim(str: string) {
  return str.replace(/\s+/g, "");
}
