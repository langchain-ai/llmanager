import { AgentState, AgentUpdate } from "../types.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { buildContext, formatContextPrompt } from "../utils/build-context.js";

const INITIAL_REASONING_PROMPT = `You're an AI manager tasked with analyzing and reasoning about a request one of your employees has made.
Your task is to analyze the request from one of your employees, and reason about whether it should be approved or rejected.

You should think through this carefully, accounting for all aspects of their request, and taking into account the following context:
- Examples of previous requests, along with their outcomes. These are previous requests, and the final outcome you came to, along with the reasoning behind that outcome.
- Reflections you've made on previous requests. This will contain your thoughts and insights into previous requests and their outcomes.
- Approval criteria on what types of requests should be approved.
- Rejection criteria on what types of requests should be rejected.

Here is the context:

{CONTEXT}

You are NOT to make a final decision, but rather to weigh the request against all of the above context, and reason about whether it should be approved or rejected.
Ensure your reasoning contains points from both sides of the argument.

The user's message will contain their request. You should ONLY respond with your reasoning, and nothing else before or after it.

Ensure your reasoning is detailed, and clear.`;

export async function initialReasoning(
  state: AgentState,
  config: LangGraphRunnableConfig,
): Promise<AgentUpdate> {
  const query = state.messages.findLast((m) => m.getType() === "human")
    ?.content as string | undefined;
  if (!query) {
    throw new Error("No query found");
  }

  const { fewShotExamples, reflections } = await buildContext(
    query,
    config.store,
  );

  const formattedPrompt = INITIAL_REASONING_PROMPT.replace(
    "{CONTEXT}",
    formatContextPrompt({
      fewShotExamples,
      reflections,
      approvalCriteria: config.configurable?.approvalCriteria,
      rejectionCriteria: config.configurable?.rejectionCriteria,
    }),
  );

  const model = new ChatAnthropic({
    model: "claude-3-7-sonnet",
    temperature: 0,
  });

  const response = await model.invoke([
    {
      role: "system",
      content: formattedPrompt,
    },
    {
      role: "user",
      content: query,
    },
  ]);

  return {
    reasoning: response.content as string,
  };
}
