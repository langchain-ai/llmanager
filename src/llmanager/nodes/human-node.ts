import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt";
import { AgentState } from "../types.js";
import {
  BaseStore,
  Command,
  END,
  interrupt,
  LangGraphRunnableConfig,
  Send,
} from "@langchain/langgraph";
import { ReflectionState } from "../../reflection/types.js";
import { findQueryStringOrThrow } from "../../utils/query.js";
import { putFewShotExamples } from "../../stores/few-shot.js";

/**
 * Constructs a description for a human interrupt based on the provided inputs.
 *
 * @param inputs The inputs containing the request, explanation, and status.
 * @returns The formatted description string.
 */
function constructDescription(inputs: {
  request: string;
  explanation: string;
  status: "approved" | "rejected";
}): string {
  return `# Approval Request

The following request was made by an employee:
\`\`\`
${inputs.request}
\`\`\`

**LLManager** is suggesting the following action be taken: **${inputs.status}**

The following explanation was provided behind the action:

${inputs.explanation}

## Actions

- To accept the action, please click 'Accept' without making changes to the inputs.
- If you agree with the action, but the explanation is incorrect, please modify the 'Explanation' input, and submit.
- If you disagree with both the action and explanation, please modify the 'Status' and 'Explanation' inputs, and submit.
- If the 'request' is not relevant, or the request is invalid, please click 'Ignore' to reject the request.

## Fields

- 'Status': The status of the request. This is either 'approved' or 'rejected'.
- 'Explanation': The explanation for your final decision. This is the final reasoning behind LLManager's decision.
`;
}

/**
 * Processes the feedback received from a human user regarding a proposed agent action.
 * Based on the human's response (`accept`, `ignore`, `edit`), this function determines
 * the next step for the agent, encapsulated within a `Command` object.
 * If the response is 'accept'/'edit', the function also updates the few-shot store with the
 * successful example.
 *
 * Throws an error if the response type is invalid or if the arguments for an 'edit' response
 * are malformed.
 *
 * @param {HumanResponse} response - The response object from the human user, indicating their feedback (accept, ignore, edit) and potentially edited arguments.
 * @param {AgentState} state - The current state of the agent, containing messages, reasoning, and the original proposed answer.
 * @param {BaseStore | undefined} store - The few-shot example store. If provided and the human accepts the response, the interaction is added as an example.
 * @returns {Command} A command object directing the agent's next action. This could be to end the process (`END`) or to proceed to a reflection step (`Send("reflection", ...)`).
 */
async function handleHumanResponse(
  response: HumanResponse,
  state: AgentState,
  inputs: {
    store: BaseStore | undefined;
    assistantId: string | undefined;
  },
): Promise<Command> {
  const responseType = response.type;
  if (responseType === "response") {
    throw new Error(
      `Invalid response type received. Expected 'accept', 'ignore', 'edit'. Received: ${responseType}`,
    );
  }

  if (responseType === "ignore") {
    // Ignored. End with no further action.
    return new Command({
      goto: END,
    });
  }

  const args = response.args;
  if (
    !args ||
    typeof args !== "object" ||
    !args.args.status ||
    !args.args.explanation
  ) {
    throw new Error(
      `Invalid response received. Expected an object containing 'status' and 'explanation'. Received:\n${JSON.stringify(args, null, 2)}`,
    );
  }

  const updatedAnswer = {
    status: args.args.status,
    explanation: args.args.explanation,
  };

  // Save the final answer & explanation in store for future use in few-shot examples
  await putFewShotExamples(inputs.store, inputs.assistantId, {
    input: findQueryStringOrThrow(state.messages),
    answer: updatedAnswer.status,
    explanation: updatedAnswer.explanation,
  });

  if (responseType === "accept") {
    // Accepted as-is. No further action is necessary.
    // HERE IS WHERE YOU WOULD IMPLEMENT THE LOGIC TO ACCEPT THE REQUEST AND TAKE ANY ADDITIONAL ACTIONS NEEDED.
    return new Command({
      goto: END,
    });
  }

  const reflectionInput: ReflectionState = {
    messages: state.messages,
    generatedReasoning: state.generatedReasoning,
    originalAnswer: state.answer,
    editedAnswer: updatedAnswer,
    changeType:
      args.args.status === state.answer.status
        ? "explanationChanged"
        : "allChanged",
  };

  // The suggested action was edited. Send to reflection.
  return new Command({
    goto: new Send("reflection", reflectionInput),
  });
}

export async function humanNode(
  state: AgentState,
  config: LangGraphRunnableConfig,
): Promise<Command> {
  const query = findQueryStringOrThrow(state.messages);

  const description = constructDescription({
    request: query,
    explanation: state.answer.explanation,
    status: state.answer.status,
  });

  const interruptConfig: HumanInterrupt = {
    action_request: {
      action: `New Decision Request: ${state.answer.status}`,
      args: {
        status: state.answer.status,
        explanation: state.answer.explanation,
      },
    },
    config: {
      allow_ignore: true,
      allow_accept: true,
      allow_edit: true,
      allow_respond: false,
    },
    description,
  };

  const response = interrupt<HumanInterrupt, HumanResponse[]>(
    interruptConfig,
  )[0];

  return handleHumanResponse(response, state, {
    store: config.store,
    assistantId: config.configurable?.assistant_id,
  });
}
