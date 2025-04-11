import { BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const ReasoningZodState = z.object({
  /**
   * The list of messages, containing the original input message
   * from the user.
   */
  messages: z
    .custom<BaseMessage[]>()
    .langgraph.reducer(
      (a, b) => addMessages(a, b),
      z.custom<BaseMessage | BaseMessage[]>(),
    ),
  /**
   * The full context prompt as plain text.
   */
  promptContext: z.string(),
  /**
   * The reasoning generated based on the system prompt, few shots, and input messages.
   */
  reasoning: z.string().default(() => ""),
});

export type ReasoningState = z.infer<typeof ReasoningZodState>;
export type ReasoningUpdate = Partial<ReasoningState>;
