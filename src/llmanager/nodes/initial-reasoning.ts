import { AgentState, AgentUpdate } from "../types.js";
import { BaseStore, LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  FewShotExample,
  searchFewShotExamples,
} from "../../stores/few-shot.js";
import { getReflections } from "../../stores/reflection.js";
import { traceable } from "langsmith/traceable";
import { ChatAnthropic } from "@langchain/anthropic";

async function buildPromptFunc(
  query: string,
  store: BaseStore | undefined,
): Promise<{
  fewShotExamples: FewShotExample[];
  reflections: string[];
}> {
  const examples = await searchFewShotExamples(store, query, { limit: 10 });

  const reflections = await getReflections(store);

  return {
    fewShotExamples: examples,
    reflections,
  };
}

const buildPrompt = traceable(buildPromptFunc, { name: "build-prompt" });

const INITIAL_REASONING_PROMPT = `You're an AI manager tasked with analyzing and reasoning about a request one of your employees has made.
Your task is to analyze the request from one of your employees, and reason about whether it should be approved or rejected.

You should think through this carefully, accounting for all aspects of their request, and taking into account the following context:
- Examples of previous requests, along with their outcomes. These are previous requests, and the final outcome you came to, along with the reasoning behind that outcome.
- Reflections you've made on previous requests. This will contain your thoughts and insights into previous requests and their outcomes.
- Approval criteria on what types of requests should be approved.
- Rejection criteria on what types of requests should be rejected.

Here is the context:

{FEW_SHOT_EXAMPLES}
{REFLECTIONS}
{APPROVAL_CRITERIA}
{REJECTION_CRITERIA}

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

  const { fewShotExamples, reflections } = await buildPrompt(
    query,
    config.store,
  );

  const formattedFewShots = fewShotExamples
    .map(
      (ex, i) => `<example index="${i}">
  Request: ${ex.input}

  Explanation: ${ex.explanation}

  Final Answer: ${ex.answer}
</example>`,
    )
    .join("\n\n");

  const formattedReflections = reflections.map((r) => `- ${r}`).join("\n");

  const formattedApprovalCriteria =
    config.configurable?.approvalCriteria ?? "None provided.";
  const formattedRejectionCriteria =
    config.configurable?.rejectionCriteria ?? "None provided.";

  const formattedPrompt = INITIAL_REASONING_PROMPT.replace(
    "{FEW_SHOT_EXAMPLES}",
    `<all-examples>\n${formattedFewShots}</all-examples>`,
  )
    .replace(
      "{REFLECTIONS}",
      `<reflections>\n${formattedReflections}</reflections>`,
    )
    .replace(
      "{APPROVAL_CRITERIA}",
      `<approval-criteria>\n${formattedApprovalCriteria}</approval-criteria>`,
    )
    .replace(
      "{REJECTION_CRITERIA}",
      `<rejection-criteria>\n${formattedRejectionCriteria}</rejection-criteria>`,
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
