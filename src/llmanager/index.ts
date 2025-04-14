import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentZodConfiguration, AgentZodState } from "./types.js";
import { graph as reasoningGraph } from "../reasoning/index.js";
import { finalAnswer } from "./nodes/final-answer.js";
import { humanNode } from "./nodes/human-node.js";
import { graph as reflectionGraph } from "../reflection/index.js";

const workflow = new StateGraph(AgentZodState, AgentZodConfiguration)
  .addNode("reasoning", reasoningGraph)
  .addNode("final_answer", finalAnswer)
  .addNode("human_node", humanNode, {
    // Human node will only reflect if the generated answer is edited/changed.
    // If it's accepted as-is, it ends.
    ends: ["reflection", END],
  })
  .addNode("reflection", reflectionGraph)
  .addEdge(START, "reasoning")
  .addEdge("reasoning", "final_answer")
  .addEdge("final_answer", "human_node")
  .addEdge("reflection", END);

export const graph = workflow.compile();
graph.name = "LLManager Graph";
