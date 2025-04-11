import { traceable } from "langsmith/traceable";
import { BaseStore } from "@langchain/langgraph";
import {
  FewShotExample,
  searchFewShotExamples,
} from "../../stores/few-shot.js";
import { getReflections } from "../../stores/reflection.js";

async function buildContextFunc(
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

export const buildContext = traceable(buildContextFunc, {
  name: "build-context",
});

interface FormatContextPromptArgs {
  fewShotExamples: FewShotExample[];
  reflections: string[];
  approvalCriteria?: string;
  rejectionCriteria?: string;
}

export function formatContextPrompt({
  fewShotExamples,
  reflections,
  approvalCriteria,
  rejectionCriteria,
}: FormatContextPromptArgs): string {
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

  const formattedApprovalCriteria = approvalCriteria ?? "None provided.";
  const formattedRejectionCriteria = rejectionCriteria ?? "None provided.";

  return `<all-examples>\n${formattedFewShots}</all-examples>

<reflections>\n${formattedReflections}</reflections>

<approval-criteria>\n${formattedApprovalCriteria}</approval-criteria>

<rejection-criteria>\n${formattedRejectionCriteria}</rejection-criteria>`;
}
