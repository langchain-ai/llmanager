import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";

export const AgentZodState = Annotation.Root({
  messages: MessagesAnnotation.spec["messages"],
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
});
