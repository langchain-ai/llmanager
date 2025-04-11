import { z } from "zod";
import { AgentState, AgentUpdate } from "../types.js";
import { ChatAnthropic } from "@langchain/anthropic";

const FINAL_ANSWER_PROMPT = `You're a highly advanced AI manager, tasked with approving or rejecting one of your employees requests.

To assist with this task, you're provided with the following context:
- Examples of previous requests, along with their outcomes. These are previous requests, and the final outcome you came to, along with the reasoning behind that outcome.
- Reflections you've made on previous requests. This will contain your thoughts and insights into previous requests and their outcomes.
- Approval criteria on what types of requests should be approved.
- Rejection criteria on what types of requests should be rejected.

{CONTEXT}

Finally, you are also given a detailed reasoning report into why the request should be approved or rejected.

{REASONING}

Use all of this context to ground your final decision.

Here is the users request:

{REQUEST}

Ensure your answer is accurate, and accounts for all of the context provided above.
`;

export async function finalAnswer(state: AgentState): Promise<AgentUpdate> {
  const query = state.messages.findLast((m) => m.getType() === "human")
    ?.content as string | undefined;
  if (!query) {
    throw new Error("No query found");
  }

  const finalAnswerSchema = z.object({
    explanation: z
      .string()
      .describe(
        "The explanation for your final decision. Ensure this is detailed, and clear. It should cover everything you considered when making your final decision.",
      ),
    status: z
      .enum(["approved", "rejected"])
      .describe(
        "The final decision. This should be either 'approved' or 'rejected'.",
      ),
  });

  const formattedPrompt = FINAL_ANSWER_PROMPT.replace(
    "{CONTEXT}",
    state.promptContext,
  )
    .replace("{REASONING}", state.reasoning)
    .replace("{REQUEST}", query);

  const model = new ChatAnthropic({
    model: "claude-3-7-sonnet",
    temperature: 0,
  }).bindTools([
    {
      name: "finalAnswer",
      schema: finalAnswerSchema,
      description:
        "The explanation behind your final decision, along with the final decision itself.",
    },
  ]);

  const response = await model.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  const toolCallArgs = response.tool_calls?.[0]?.args as z.infer<
    typeof finalAnswerSchema
  >;
  if (!toolCallArgs) {
    throw new Error("No tool call found");
  }

  return {
    answer: finalAnswerSchema.parse(toolCallArgs),
  };
}
