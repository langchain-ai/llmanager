import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getReflections, putReflections } from "../../stores/reflection.js";
import { ReflectionState, ReflectionUpdate } from "../types.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { loadModelFromConfig } from "../../utils/model.js";

const FULL_REFLECTION_PROMPT = `You're an advanced AI assistant tasked with generating reflections on a an incorrect answer to a user request.
A human manually reviewed the answer, and the explanation and determined they were both incorrect.

The answer and explanation are apart of a review process, where an employee submits a request for approval, and given some approval and rejection criteria, you determined whether to approve or reject the request.
Before coming to a final decision, you generated an explanation and reasoning behind your decision. A manual review has determined both of these were incorrect.

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

You've also been provided with reflections you generated in the past from incorrect responses. Here is the full list of reflections:
<all-reflections>
  {REFLECTIONS}
</all-reflections>

Your new task is to do the following:
1. Carefully examine your original (incorrect) answer and explanation.
2. Carefully examine the corrected answer and explanation.
3. Think deeply about where you went wrong, and how you can avoid making the same mistake in the future. Compare your explanation to the human corrected explanation to identify the root cause.
4. Generate clear, concise reflections which will allow you to avoid making the same mistake in the future. Read the 'reflection-generation-rules' below for more details.

<reflection-generation-rules>
1. Reflections must be concise, and direct.
2. Reflections should never be duplicated. If the reflection you want to generate already exists in the 'all-reflections' section, do not generate it again.
3. Avoid generating multiple, similar reflections, as this will bloat the list, and can lead to confusion.
4. Reflections should be specific and actionable.
5. Reflections should be focused on the root cause of the error, as to prevent the same mistake from happening again.
6. Reflections should be written in the present tense, as they will be used to guide future decision-making.
</reflection-generation-rules>

With all of this in mind, please generate new reflections on your mistake to assist with future decision-making. You should generate at least one reflection, as you got this wrong so something needs to be changed.
However, you do not need to generate multiple unless you failed in multiple ways. This is very important as you do not want to generate bloated, and overly long reflections.`;

function buildReflectionPrompt(inputs: {
  explanation: string;
  answer: string;
  correctedExplanation: string;
  correctedAnswer: string;
  reflections: string[];
}) {
  return FULL_REFLECTION_PROMPT.replace("{EXPLANATION}", inputs.explanation)
    .replace("{ANSWER}", inputs.answer)
    .replace("{CORRECTED_EXPLANATION}", inputs.correctedExplanation)
    .replace("{CORRECTED_ANSWER}", inputs.correctedAnswer)
    .replace(
      "{REFLECTIONS}",
      inputs.reflections.map((r) => `<reflection>${r}</reflection>`).join(""),
    );
}

export async function fullReflection(
  state: ReflectionState,
  config: LangGraphRunnableConfig,
): Promise<ReflectionUpdate> {
  const reflections = await getReflections(
    config.store,
    config.configurable?.assistant_id,
  );
  const prompt = buildReflectionPrompt({
    explanation: state.originalAnswer.explanation,
    answer: state.originalAnswer.status,
    correctedExplanation: state.editedAnswer.explanation,
    correctedAnswer: state.editedAnswer.status,
    reflections: reflections,
  });

  const model = await loadModelFromConfig(config, {
    temperature: 0,
    thinking: {
      type: "enabled",
      budget_tokens: 3072,
    },
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
