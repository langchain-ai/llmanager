import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";

export const ReflectionZodState = Annotation.Root({
  messages: MessagesAnnotation.spec["messages"],
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
});

export type ReflectionState = typeof ReflectionZodState.State;
export type ReflectionUpdate = typeof ReflectionZodState.Update;
