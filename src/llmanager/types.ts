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
   * The full context prompt as plain text.
   */
  promptContext: z.string(),
  /**
   * The reasoning generated based on the system prompt, few shots, and input messages.
   */
  reasoning: z.string().default(() => ""),
  /**
   * The final answer, and explanation.
   */
  answer: z.object({
    explanation: z.string(),
    status: z.enum(["approved", "rejected"]),
  }),
});

export type AgentState = z.infer<typeof AgentZodState>;
export type AgentUpdate = Partial<AgentState>;

export const AgentZodConfiguration = z.object({
  /**
   * The criteria for a request to be approved.
   */
  approvalCriteria: z.string().optional(),
  /**
   * The criteria for a request to be rejected.
   */
  rejectionCriteria: z.string().optional(),
});
