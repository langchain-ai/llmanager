import { Command, END, START, StateGraph } from "@langchain/langgraph";
import { ReflectionState, ReflectionZodState } from "./types.js";
import { fullReflection } from "./nodes/full-reflection.js";
import { explanationReflection } from "./nodes/explanation-reflection.js";

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

const workflow = new StateGraph(ReflectionZodState)
  .addNode("routeReflection", routeReflection, {
    ends: ["full_reflection", "explanation_reflection"],
  })
  .addNode("full_reflection", fullReflection)
  .addNode("explanation_reflection", explanationReflection)
  .addEdge(START, "routeReflection")
  .addEdge("explanation_reflection", END)
  .addEdge("full_reflection", END);

export const graph = workflow.compile();
graph.name = "Reflection Graph";
