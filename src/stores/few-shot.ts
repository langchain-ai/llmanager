import { v4 as uuidv4 } from "uuid";
import { BaseStore } from "@langchain/langgraph";
import { traceable } from "langsmith/traceable";

const FEW_SHOT_NAMESPACE = ["few-shot"];

export type FewShotExample = {
  /**
   * The final answer to the request.
   */
  answer: string;
  /**
   * The explanation behind the answer.
   */
  explanation: string;
  /**
   * The user's input.
   */
  input: string;
};

async function searchFewShotExamplesFunc(
  store: BaseStore | undefined,
  query: string,
  args?: { limit?: number },
): Promise<FewShotExample[]> {
  if (!store) {
    throw new Error("Store not found");
  }

  const results = await store.search(FEW_SHOT_NAMESPACE, {
    query,
    limit: args?.limit,
  });

  const items = results.map((r) => r.value as FewShotExample);
  return items;
}

export const searchFewShotExamples = traceable(searchFewShotExamplesFunc, {
  name: "search-few-shot-examples",
});

async function putFewShotExamplesFunc(
  store: BaseStore | undefined,
  example: FewShotExample,
): Promise<void> {
  if (!store) {
    throw new Error("Store not found");
  }
  await store.put(FEW_SHOT_NAMESPACE, uuidv4(), example);
}

export const putFewShotExamples = traceable(putFewShotExamplesFunc, {
  name: "put-few-shot-examples",
});
