import {
  BaseChatModel,
  BaseChatModelCallOptions,
  BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { initChatModel } from "langchain/chat_models/universal";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { AIMessageChunk } from "@langchain/core/messages";

type BaseChatModelWithBindTools = BaseChatModel & {
  bindTools: (
    tools: BindToolsInput[],
    kwargs?: Partial<RunnableConfig>,
  ) => Runnable<
    BaseLanguageModelInput,
    AIMessageChunk,
    BaseChatModelCallOptions
  >;
};
/**
 * Loads a chat model from the configuration object. Defaults to
 * `anthropic/claude-3-7-sonnet-latest`.
 *
 * @param config The configuration object containing the model ID.
 * @returns The loaded chat model.
 */
export async function loadModelFromConfig(
  config: LangGraphRunnableConfig,
  modelConfig?: Record<string, unknown>,
): Promise<BaseChatModelWithBindTools> {
  const modelId =
    config.configurable?.modelId ?? "anthropic/claude-3-7-sonnet-latest";

  const model = await initChatModel(modelId, modelConfig);
  if (!model.bindTools) {
    throw new Error("Model does not support binding tools");
  }
  return model;
}
