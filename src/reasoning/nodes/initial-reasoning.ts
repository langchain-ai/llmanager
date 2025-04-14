import { ReasoningState, ReasoningUpdate } from "../types.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  buildContext,
  formatContextPrompt,
} from "../../utils/build-context.js";
import { findQueryStringOrThrow } from "../../utils/query.js";
import { loadModelFromConfig } from "../../utils/model.js";

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
  state: ReasoningState,
  config: LangGraphRunnableConfig,
): Promise<ReasoningUpdate> {
  const query = findQueryStringOrThrow(state.messages);

  const { fewShotExamples, reflections } = await buildContext(query, {
    store: config.store,
    assistantId: config.configurable?.assistant_id,
  });

  const formattedPrompt = INITIAL_REASONING_PROMPT.replace(
    "{CONTEXT}",
    formatContextPrompt({
      fewShotExamples,
      reflections,
      approvalCriteria: config.configurable?.approvalCriteria,
      rejectionCriteria: config.configurable?.rejectionCriteria,
    }),
  );

  const model = await loadModelFromConfig(config, {
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
    generatedReasoning: response.content as string,
    promptContext: formattedPrompt,
  };
}
