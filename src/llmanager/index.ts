import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentZodConfiguration, AgentZodState } from "./types.js";
import { initialReasoning } from "./nodes/initial-reasoning.js";
import { finalAnswer } from "./nodes/final-answer.js";
import { humanNode } from "./nodes/human-node.js";
import { graph as reflectionGraph } from "../reflection/index.js";

const workflow = new StateGraph(AgentZodState, AgentZodConfiguration)
  .addNode("initial_reasoning", initialReasoning)
  .addNode("final_answer", finalAnswer)
  .addNode("human_node", humanNode)
  .addNode("reflection", reflectionGraph)
  .addEdge(START, "initial_reasoning")
  .addEdge("initial_reasoning", "final_answer")
  .addEdge("final_answer", "human_node")
  .addEdge("human_node", "reflection")
  .addEdge("reflection", END);

// TODO: Remove as any once type error fixed
export const graph = workflow.compile() as any;
graph.name = "LLManager Graph";
