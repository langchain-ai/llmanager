import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt";
import { AgentState } from "../types.js";
import { Command, END, interrupt, Send } from "@langchain/langgraph";

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

LLManager is suggesting the following action be: **${inputs.status}**

Explanation behind the suggestion:

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

export async function humanNode(state: AgentState): Promise<Command> {
  const query = state.messages.findLast((m) => m.getType() === "human")
    ?.content as string | undefined;
  if (!query) {
    throw new Error("No query found");
  }

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

  if (responseType === "accept") {
    // Accepted as-is. No further action is necessary.
    // HERE IS WHERE YOU WOULD IMPLEMENT THE LOGIC TO ACCEPT THE REQUEST AND TAKE ANY ADDITIONAL ACTIONS NEEDED.
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

  // The suggested action was edited. Send to reflection.
  return new Command({
    goto: new Send("reflection", {
      messages: state.messages,
      reasoning: state.reasoning,
      answer: state.answer,
    }),
  });
}
