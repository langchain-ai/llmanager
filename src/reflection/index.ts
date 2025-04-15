import { Command, END, START, StateGraph } from "@langchain/langgraph";
import {
  ReflectionState,
  ReflectionZodConfiguration,
  ReflectionZodState,
} from "./types.js";
import { fullReflection } from "./nodes/full-reflection.js";
import { explanationReflection } from "./nodes/explanation-reflection.js";
import { extractReflections } from "./nodes/extract-reflections.js";

/**
 * Routes the reflection based on the change type. If the changeType is
 * 'explanationChanged', it will route to the explanation reflection node.
 * Otherwise, it will route to the full reflection node.
 *
 * @param state The current state of the reflection.
 * @returns The command to route to the appropriate reflection node.
 */
function routeReflection(state: ReflectionState): Command {
  if (state.changeType === "explanationChanged") {
    return new Command({
      goto: "explanation_reflection",
    });
  }
  return new Command({
    goto: "full_reflection",
  });
}

const workflow = new StateGraph(ReflectionZodState, ReflectionZodConfiguration)
  .addNode("routeReflection", routeReflection, {
    ends: ["full_reflection", "explanation_reflection"],
  })
  .addNode("full_reflection", fullReflection)
  .addNode("explanation_reflection", explanationReflection)
  .addNode("extract_reflections", extractReflections)
  .addEdge(START, "routeReflection")
  .addEdge("explanation_reflection", "extract_reflections")
  .addEdge("full_reflection", "extract_reflections")
  .addEdge("extract_reflections", END);

export const graph = workflow.compile();
graph.name = "Reflection Graph";
