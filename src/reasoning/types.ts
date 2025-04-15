import { Annotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const ReasoningZodState = Annotation.Root({
  query: Annotation<string>(),
  promptContext: Annotation<string>(),
  generatedReasoning: Annotation<string>(),
});

export type ReasoningState = typeof ReasoningZodState.State;
export type ReasoningUpdate = typeof ReasoningZodState.Update;

export const ReasoningZodConfiguration = z.object({
  /**
   * The model ID to use for the reasoning generation.
   * Should be in the format `provider/model_name`.
   * Defaults to `anthropic/claude-3-7-sonnet-latest`.
   */
  modelId: z.string().optional(),
});
