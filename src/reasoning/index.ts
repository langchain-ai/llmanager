import { END, START, StateGraph } from "@langchain/langgraph";
import { ReasoningZodConfiguration, ReasoningZodState } from "./types.js";
import { initialReasoning } from "./nodes/initial-reasoning.js";

const workflow = new StateGraph(ReasoningZodState, ReasoningZodConfiguration)
  .addNode("initial_reasoning", initialReasoning)
  .addEdge(START, "initial_reasoning")
  .addEdge("initial_reasoning", END);

export const graph = workflow.compile();
graph.name = "Request Reasoning Graph";
