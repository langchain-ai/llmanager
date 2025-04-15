import { Annotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const AgentZodStateInput = Annotation.Root({
  query: Annotation<string>(),
});

export const AgentZodState = Annotation.Root({
  ...AgentZodStateInput.spec,
  promptContext: Annotation<string>(),
  generatedReasoning: Annotation<string>(),
  answer: Annotation<{
    explanation: string;
    status: "approved" | "rejected";
  }>(),
});

export type AgentState = typeof AgentZodState.State;
export type AgentUpdate = typeof AgentZodState.Update;

export const AgentZodConfiguration = z.object({
  /**
   * The criteria for a request to be approved.
   */
  approvalCriteria: z.string().optional(),
  /**
   * The criteria for a request to be rejected.
   */
  rejectionCriteria: z.string().optional(),
  /**
   * The model ID to use for the LLM generations.
   * Should be in the format `provider/model_name`.
   * Defaults to `anthropic/claude-3-7-sonnet-latest`.
   */
  modelId: z.string().optional(),
});
