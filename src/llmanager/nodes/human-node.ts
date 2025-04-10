import { AgentState, AgentUpdate } from "../types.js";

export async function humanNode(state: AgentState): Promise<AgentUpdate> {
  throw new Error("Not implemented" + state);
}
