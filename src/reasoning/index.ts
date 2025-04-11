import { END, START, StateGraph } from "@langchain/langgraph";
import { ReasoningZodState } from "./types.js";
import { initialReasoning } from "./nodes/initial-reasoning.js";

const workflow = new StateGraph(ReasoningZodState)
  .addNode("initial_reasoning", initialReasoning)
  .addEdge(START, "initial_reasoning")
  .addEdge("initial_reasoning", END);

// TODO: Remove as any once type error fixed
export const graph = workflow.compile() as any;
graph.name = "Request Reasoning Graph";
