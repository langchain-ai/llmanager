import { BaseMessage } from "@langchain/core/messages";

/**
 * Finds the last message in the list of messages that is a human message.
 * Returns the content of the message as a string.
 * Throws an error if no human message is found.
 *
 * @param messages - The list of messages to search through.
 * @returns The content of the last human message as a string.
 */
export function findQueryStringOrThrow(messages: BaseMessage[]): string {
  console.log("messages", messages);
  const content = messages.findLast((m) => m.getType() === "human")?.content;
  if (!content) {
    throw new Error("No query found");
  }
  if (typeof content === "string") {
    return content;
  }
  return content
    .filter(
      (c): c is { type: "text"; text: string } =>
        c.type === "text" && "text" in c && c.text,
    )
    .map((c) => c.text)
    .join("\n");
}
