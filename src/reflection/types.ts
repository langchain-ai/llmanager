import { Annotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const ReflectionZodState = Annotation.Root({
  query: Annotation<string>(),
  generatedReasoning: Annotation<string>(),
  originalAnswer: Annotation<{
    explanation: string;
    status: "approved" | "rejected";
  }>(),
  editedAnswer: Annotation<{
    explanation: string;
    status: "approved" | "rejected";
  }>(),
  changeType: Annotation<"explanationChanged" | "allChanged">(),
  reflectionsSummary: Annotation<string>(),
});

export type ReflectionState = typeof ReflectionZodState.State;
export type ReflectionUpdate = typeof ReflectionZodState.Update;

export const ReflectionZodConfiguration = z.object({
  /**
   * The model ID to use for the reflection generation.
   * Should be in the format `provider/model_name`.
   * Defaults to `anthropic/claude-3-7-sonnet-latest`.
   */
  modelId: z.string().optional(),
});
