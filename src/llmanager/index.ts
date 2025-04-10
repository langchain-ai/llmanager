import { START, StateGraph } from "@langchain/langgraph";
import { AgentZodState } from "./types.js";
import { buildPrompt } from "./nodes/build-prompt.js";
import { initialReasoning } from "./nodes/initial-reasoning.js";
import { finalGeneration } from "./nodes/final-generation.js";
import { humanNode } from "./nodes/human-node.js";
import { graph as reflectionGraph } from "../reflection/index.js";

const workflow = new StateGraph(AgentZodState)
  .addNode("build_prompt", buildPrompt)
  .addNode("initial_reasoning", initialReasoning)
  .addNode("final_generation", finalGeneration)
  .addNode("human_node", humanNode)
  .addNode("reflection", reflectionGraph)
  .addEdge(START, "build_prompt")
  .addEdge("build_prompt", "initial_reasoning")
  .addEdge("initial_reasoning", "final_generation")
  .addEdge("final_generation", "human_node")
  .addEdge("human_node", "reflection")
  .addEdge("reflection", "build_prompt");

// TODO: Remove as any once type error fixed
export const graph = workflow.compile() as any;
graph.name = "LLManager Graph";
