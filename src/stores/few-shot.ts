import { BaseStore } from "@langchain/langgraph";
import { traceable } from "langsmith/traceable";

const FEW_SHOT_NAMESPACE = ["few-shot"];
const FEW_SHOT_KEY = "examples";

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

const _DATA_KEY = "few_shots";

async function getFewShotExamplesFunc(
  store: BaseStore | undefined,
): Promise<FewShotExample[]> {
  if (!store) {
    throw new Error("Store not found");
  }

  const results = await store.get(FEW_SHOT_NAMESPACE, FEW_SHOT_KEY);
  if (!results?.value) {
    return [];
  }

  return results.value[_DATA_KEY] ?? [];
}

export const getFewShotExamples = traceable(getFewShotExamplesFunc, {
  name: "get-few-shot-examples",
});

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

  const items: FewShotExample[] = results.flatMap(
    (r) => r.value?.[_DATA_KEY] ?? [],
  );
  return items;
}

export const searchFewShotExamples = traceable(searchFewShotExamplesFunc, {
  name: "search-few-shot-examples",
});

async function putFewShotExamplesFunc(
  store: BaseStore | undefined,
  examples: FewShotExample[],
): Promise<void> {
  if (!store) {
    throw new Error("Store not found");
  }
  await store.put(FEW_SHOT_NAMESPACE, FEW_SHOT_KEY, { [_DATA_KEY]: examples });
}

export const putFewShotExamples = traceable(putFewShotExamplesFunc, {
  name: "put-few-shot-examples",
});
