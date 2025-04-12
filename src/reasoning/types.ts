import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";

export const ReasoningZodState = Annotation.Root({
  messages: MessagesAnnotation.spec["messages"],
  promptContext: Annotation<string>(),
  generatedReasoning: Annotation<string>(),
});

export type ReasoningState = typeof ReasoningZodState.State;
export type ReasoningUpdate = typeof ReasoningZodState.Update;
