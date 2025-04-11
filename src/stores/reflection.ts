import { BaseStore } from "@langchain/langgraph";
import { traceable } from "langsmith/traceable";

const REFLECTION_NAMESPACE = ["reflection"];
const REFLECTION_KEY = "reflections";

const _DATA_KEY = "reflections";

async function getReflectionsFunc(
  store: BaseStore | undefined,
): Promise<string[]> {
  if (!store) {
    throw new Error("Store not found");
  }

  const results = await store.get(REFLECTION_NAMESPACE, REFLECTION_KEY);
  if (!results?.value) {
    return [];
  }

  return results.value[_DATA_KEY] ?? [];
}

export const getReflections = traceable(getReflectionsFunc, {
  name: "get-reflections",
});

async function putReflectionsFunc(
  store: BaseStore | undefined,
  reflections: string[],
): Promise<void> {
  if (!store) {
    throw new Error("Store not found");
  }
  await store.put(REFLECTION_NAMESPACE, REFLECTION_KEY, {
    [_DATA_KEY]: reflections,
  });
}

export const putReflections = traceable(putReflectionsFunc, {
  name: "put-reflections",
});
