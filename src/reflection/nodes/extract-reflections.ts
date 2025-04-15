import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { loadModelFromConfig } from "../../utils/model.js";
import { ReflectionState, ReflectionUpdate } from "../types.js";
import { z } from "zod";
import { getReflections, putReflections } from "../../stores/reflection.js";

const EXTRACT_REFLECTIONS_PROMPT = `You're an advanced AI assistant tasked with extracting reflections/memories from a larger reflection text you previously generated.

This piece of text was generated in response to an incorrect answer and explanation you provided in response to a user request.
<instructions>
Please examine the reflection text, and extract one (or more if many mistakes were made) concise, and direct reflection/memory to add to a list of reflections/memories.
This list will be used in all future decision-making processes, so ensure the reflection/memory (or multiple) you generate will assist with future decision-making so that you don't make the same mistake twice.
</instructions>

<reflection-generation-rules>
1. Reflections must be concise, and direct.
2. Reflections should never be duplicated. If the reflection you want to generate already exists in the 'all-reflections' section, do not generate it again.
3. Avoid generating multiple, similar reflections, as this will bloat the list, and can lead to confusion.
4. Reflections should be specific and actionable.
5. Reflections should be focused on the root cause of the error, as to prevent the same mistake from happening again.
6. Reflections should be written in the present tense, as they will be used to guide future decision-making.
</reflection-generation-rules>

<reflection-text>
{REFLECTION_TEXT}
</reflection-text>

Here is your original (incorrect) answer and explanation:
<original-incorrect-response>
  <explanation>
    {EXPLANATION}
  </explanation>
  <answer>
    {ANSWER}
  </answer>
</original-incorrect-response>

And here is the human corrected answer, along with the human corrected explanation:
<corrected-response>
  <explanation>
    {CORRECTED_EXPLANATION}
  </explanation>
  <answer>
    {CORRECTED_ANSWER}
  </answer>
</corrected-response>

Here is the full list of reflections/memories you've generated in the past:
<all-reflections>
{REFLECTIONS}
</all-reflections>

Please carefully read over all of the provided context, think slowly, and generate one (or more if many mistakes were made) concise, and direct reflection/memory to add to a list of reflections/memories.
`;

function buildExtractReflectionsPrompt(inputs: {
  reflectionsSummary: string;
  explanation: string;
  answer: string;
  correctedExplanation: string;
  correctedAnswer: string;
  reflections: string[];
}): string {
  return EXTRACT_REFLECTIONS_PROMPT.replace(
    "{REFLECTION_TEXT}",
    inputs.reflectionsSummary,
  )
    .replace("{EXPLANATION}", inputs.explanation)
    .replace("{ANSWER}", inputs.answer)
    .replace("{CORRECTED_EXPLANATION}", inputs.correctedExplanation)
    .replace("{CORRECTED_ANSWER}", inputs.correctedAnswer)
    .replace(
      "{REFLECTIONS}",
      inputs.reflections.map((r) => `<reflection>${r}</reflection>`).join(""),
    );
}

export async function extractReflections(
  state: ReflectionState,
  config: LangGraphRunnableConfig,
): Promise<ReflectionUpdate> {
  const model = await loadModelFromConfig(config, {
    temperature: 0,
  });

  const modelWithTools = model.bindTools(
    [
      {
        name: "generate_reflections",
        schema: z.object({
          reflections: z
            .array(z.string())
            .describe(
              "New reflections on your mistake. You can generate a single reflection, or multiple reflections if you failed in multiple ways.",
            ),
        }),
        description:
          "Generate new reflections (or a single reflection) on your mistake, which you can use in future decision-making to avoid the mistake you made in this instance.",
      },
    ],
    {
      tool_choice: "generate_reflections",
    },
  );

  const reflections = await getReflections(
    config.store,
    config.configurable?.assistant_id,
  );

  const prompt = buildExtractReflectionsPrompt({
    explanation: state.originalAnswer.explanation,
    answer: state.originalAnswer.status,
    correctedExplanation: state.editedAnswer.explanation,
    correctedAnswer: state.editedAnswer.status,
    reflections: reflections,
    reflectionsSummary: state.reflectionsSummary,
  });

  const response = await modelWithTools.invoke([
    {
      role: "human",
      content: prompt,
    },
  ]);

  const newReflections = response.tool_calls?.[0]?.args?.reflections as
    | string[]
    | undefined;
  if (!newReflections?.length) {
    throw new Error("No new reflections generated");
  }

  await putReflections(config.store, config.configurable?.assistant_id, [
    ...reflections,
    ...newReflections,
  ]);

  return {};
}
