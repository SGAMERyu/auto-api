export function log(...messages: (unknown | string)[]) {
  const textList = messages.map((message) => {
    if (typeof message === "string") {
      return message;
    }
    return JSON.stringify(message, null, 2);
  });
  console.log(...textList);
}
