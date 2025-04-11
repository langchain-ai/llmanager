import { BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const ReflectionZodState = z.object({
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
   * The reasoning generated based on the system prompt, few shots, and input messages.
   */
  reasoning: z.string().default(() => ""),
  /**
   * The original answer generated by the LLM. Use this as a
   * baseline on what to reflect on.
   */
  originalAnswer: z.object({
    explanation: z.string(),
    status: z.enum(["approved", "rejected"]),
  }),
  /**
   * The edited answer the human provided.
   */
  editedAnswer: z.object({
    explanation: z.string(),
    status: z.enum(["approved", "rejected"]),
  }),
  /**
   * The change that was made to the original suggestion, and what
   * the reflection should be focused on.
   * 'explanationChanged' - if the suggestion action was correct,
   *  but the explanation behind it was incorrect. Preform reflection
   *  on the explanation only.
   * 'allChanged' - if the suggestion action was incorrect (and
   *  the explanation by extension). Perform reflection on both the
   *  action and explanation.
   */
  changeType: z.enum(["explanationChanged", "allChanged"]),
});

export type ReflectionState = z.infer<typeof ReflectionZodState>;
export type ReflectionUpdate = Partial<ReflectionState>;
