import { BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const AgentZodState = z.object({
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
   * The few shot examples to be used in the prompt.
   * An array of few shots, with each item containing the example.
   */
  fewShots: z.array(z.string()).default(() => []),
  /**
   * The reasoning generated based on the system prompt, few shots, and input messages.
   */
  reasoning: z.string().default(() => ""),
  /**
   * The final answer, and explanation.
   */
  answer: z
    .object({
      answer: z.string(),
      explanation: z.string(),
    })
    .default(() => ({ answer: "", explanation: "" })),
});

export type AgentState = z.infer<typeof AgentZodState>;
export type AgentUpdate = Partial<AgentState>;
