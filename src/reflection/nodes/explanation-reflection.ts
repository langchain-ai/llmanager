import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getReflections, putReflections } from "../../stores/reflection.js";
import { ReflectionState, ReflectionUpdate } from "../types.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

const EXPLANATION_REFLECTION_PROMPT = `You're an advanced AI assistant tasked with generating reflections on an incorrect explanation for a user request, even though the final answer was correct.
A human manually reviewed the explanation and determined it was incorrect, despite the answer being correct.

The answer and explanation are part of a review process where an employee submits a request for approval, and given some approval and rejection criteria, you determined whether to approve or reject the request.
Before coming to a final decision, you generated reasoning and an explanation. While your final answer (approve/reject) was correct, the explanation you provided was deemed incorrect by a manual review.

Here is your original (incorrect) explanation:
<original-incorrect-explanation>
  {EXPLANATION}
</original-incorrect-explanation>

And here is the human corrected explanation:
<corrected-explanation>
  {CORRECTED_EXPLANATION}
</corrected-explanation>

Here is the original reasoning you generated which led to the correct answer, but incorrect explanation:
<original-reasoning>
  {REASONING}
</original-reasoning>

You've also been provided with reflections you generated in the past from incorrect responses. Here is the full list of reflections:
<all-reflections>
{REFLECTIONS}
</all-reflections>

Your new task is to do the following:
1. Carefully examine your original (incorrect) explanation.
2. Carefully examine the corrected explanation.
3. Carefully examine the original reasoning you generated.
4. Think deeply about why your explanation was wrong, even though your reasoning led to the correct final answer. How did the reasoning fail to translate into an accurate explanation? Compare your explanation to the human corrected explanation to identify the root cause.
5. Generate clear, concise reflections which will allow you to avoid making the same mistake (generating an incorrect explanation despite a correct answer) in the future. Read the 'reflection-generation-rules' below for more details.

<reflection-generation-rules>
1. Reflections must be concise, and direct.
2. Reflections should never be duplicated. If the reflection you want to generate already exists in the 'all-reflections' section, do not generate it again.
3. Avoid generating multiple, similar reflections, as this will bloat the list, and can lead to confusion.
4. Reflections should be specific and actionable, focusing on improving the explanation generation process based on the reasoning.
5. Reflections should be focused on the root cause of the error in explanation generation.
6. Reflections should be written in the present tense, as they will be used to guide future decision-making.
</reflection-generation-rules>

With all of this in mind, please generate new reflections on your mistake to assist with future decision-making. You should generate at least one reflection, as you got the explanation wrong so something needs to be changed.
However, you do not need to generate multiple unless you failed in multiple ways. This is very important as you do not want to generate bloated, and overly long reflections.`;

function buildReflectionPrompt(inputs: {
  explanation: string;
  correctedExplanation: string;
  reasoning: string;
  reflections: string[];
}) {
  return EXPLANATION_REFLECTION_PROMPT.replace(
    "{EXPLANATION}",
    inputs.explanation,
  )
    .replace("{CORRECTED_EXPLANATION}", inputs.correctedExplanation)
    .replace("{REASONING}", inputs.reasoning)
    .replace(
      "{REFLECTIONS}",
      inputs.reflections.map((r) => `  - ${r}`).join("\n"),
    );
}

export async function explanationReflection(
  state: ReflectionState,
  config: LangGraphRunnableConfig,
): Promise<ReflectionUpdate> {
  const reflections = await getReflections(
    config.store,
    config.configurable?.assistant_id,
  );
  const prompt = buildReflectionPrompt({
    explanation: state.originalAnswer.explanation,
    correctedExplanation: state.editedAnswer.explanation,
    reasoning: state.generatedReasoning,
    reflections: reflections,
  });

  const model = new ChatAnthropic({
    model: "claude-3-7-sonnet-latest",
    temperature: 0,
    thinking: {
      type: "enabled",
      budget_tokens: 3072,
    },
  }).bindTools(
    [
      {
        name: "generate_reflections",
        schema: z.object({
          reflections: z
            .array(z.string())
            .describe(
              "New reflections on your mistake in generating the explanation. You can generate a single reflection, or multiple reflections if you failed in multiple ways.",
            ),
        }),
        description:
          "Generate new reflections (or a single reflection) on your mistake in generating the explanation, which you can use in future decision-making to avoid the mistake you made in this instance.",
      },
    ],
    {
      tool_choice: "generate_reflections",
    },
  );

  const response = await model.invoke([{ role: "human", content: prompt }]);

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
