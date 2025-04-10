import { START, StateGraph } from "@langchain/langgraph";
import { ReflectionZodState } from "./types.js";
import { reflect } from "./nodes/reflect.js";

const workflow = new StateGraph(ReflectionZodState)
  .addNode("reflect", reflect)
  .addEdge(START, "reflect");

// TODO: Remove as any once type error fixed
export const graph = workflow.compile() as any;
graph.name = "Reflection Graph";
