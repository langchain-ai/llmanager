# LLManager

> [!TIP]
> 🎥 Watch [this video](https://youtu.be/uqRK_aJBR2w) for a deep dive into LLManager's architecture, use cases, and more!

LLManager is a LangGraph workflow for managing approval requests. It uses reflection to improve and learn over time, along with dynamic prompt composition to handle a wide variety of approval requests.

![Architecture Diagram](/static/architecture-diagram.png)

## Usage

LLManager is configurable by setting two custom fields:

- `approvalCriteria`: The criteria for a request to be approved.
- `rejectionCriteria`: The criteria for a request to be rejected.

These fields are set in the graph's configuration object, and can be tied to specific assistants. These are used in the approval flow to determine whether or not a request should be approved or rejected.

You do not need to set these fields, as LLManager will learn from past experiences and update its prompt accordingly. However, setting them will help the model make more informed decisions, and lessen the "onboarding" period.

After creating a new assistant and (optionally) setting these fields, you can start using LLManager for approval requests. The recommended method of doing this is through the [Agent Inbox](https://github.com/langchain-ai/agent-inbox). Read [this section](#agent-inbox) to learn more.

### Configuration

The following fields can be set in the graph's configuration object:

#### `approvalCriteria`

A string that defines the criteria for a request to be approved.

#### `rejectionCriteria`

A string that defines the criteria for a request to be rejected.

#### `modelId`

A string that defines the model to use for the graph. Should be in the format `provider/model_name`. This must be a provider that is supported by the `initChatModel` method. The model also must support tool calling. To use non OpenAI/Anthropic models, you must install their LangChain integration package (OpenAI and Anthropic integration packages are already installed). E.g. `yarn install @langchain/google-genai`.

Default: `anthropic/claude-3-7-sonnet-latest`.

## Development

To use LLManager locally, follow these steps:

Clone the repository:

```bash
git clone https://github.com/langchain-ai/llmanager.git
```

Navigate into the project directory and install dependencies:

```bash
cd llmanager
yarn install
```

Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

```bash
# ------------------LangSmith tracing------------------
LANGCHAIN_PROJECT="default"
LANGCHAIN_API_KEY="lsv2_..."
LANGCHAIN_TRACING_V2="true"
# For running LangSmith evals
LANGSMITH_TEST_TRACKING="true"
# -----------------------------------------------------

# LLMs
ANTHROPIC_API_KEY=""
```

Start the development server:

```bash
yarn dev
```

This will start the in memory LangGraph server at [`http://localhost:2024`](http://localhost:2024). Below, I'll cover the recommended way to interact with LLManager in development.

### Evaluations & Agent Inbox

#### Evaluations

The main way to interact with LLManager in development is by running the end-to-end evaluations, then using the Agent Inbox to view and respond to approval requests.

First, you can run the E2E evaluations by running the following command:

```bash
yarn test:single evals/e2e.int.test.ts
```

This will run the graph from start to finish over 25 unique requests. Each E2E eval has a new assistant created for it because the reflections & few-shot examples are namespaced by assistant ID. When running the eval, it will log the UUID for the new assistant to the terminal. Record this value, as we'll need it later.

To use the same assistant (and thus the same reflections & few-shot examples), you should modify the code which creates and sets the assistant ID before running the test, to instead use a hardcoded assistant ID, or search for one beforehand.

After running your evaluations, you should add this graph to the Agent Inbox.

#### Agent Inbox

Visit [dev.agentinbox.ai](https://dev.agentinbox.ai) and click `Add Inbox` (if you have never added an inbox before, you'll be automatically prompted to add one). Then, enter the following values to the form:

- `Assistant/Graph ID`: Add the assistant UUID which was logged to the terminal after running the evaluations.
- `Deployment URL`: `http://localhost:2024` - this is the URL of the LangGraph server. Once you bring this to production, you'll need to add a new graph pointing to the production LangGraph server.
- `Name`: This can be whatever you want. E.g. `LLManager`

After entering these values, click submit and select/refresh the inbox to ensure you have the latest events. Then, you can start using the inbox to accept or reject requests!

## How it works

![LLManager Workflow](/static/graph-screenshot.png)

Upon receiving a request, LLManager will perform the following steps:

### Reasoning

This is the first step in the graph. It's a subgraph, which means it's very easy to expand on, and customize for your specific use case.

By default, it runs a single node which does the following:

#### Construct the prompt

This involves extracting past reflections, and fetching few-shot examples from previous requests. The few-shot examples are retrieved using semantic search, where we use the request as a query, and return 10 semantically similar requests from past history. These examples include the request, the final answer, and the explanation behind the answer. Using all of this context, we prompt the model to generate a "reasoning report" on whether or not to approve the request. We explicitly tell it _not_ to make a final decision, but instead to perform reasoning about the request.

### Generate answer

After running the reasoning subgraph, we return the reasoning report, along with the prompt context (few shot examples and reflections). Using both the reasoning report, and the context, we prompt the LLM to use all of the provided context to come to a final conclusion.

### Human review

After generating a reasoning report and a final answer, we interrupt the graph and wait for a human to review, and approve/edit or reject the request. This step is crucial to LLManager's learning process, as we allow a human to modify the final answer, along with the explanation behind it. If a request is ignored, we do nothing with it. If it's accepted/edited, we take the final answer, along with the explanation and request, and store it in the few-shot example store to be used in future requests. Since we allow the human to modify not only the final answer, but also the explanation behind the answer, we can be sure that the few-shot examples are always up to date, and contain accurate, human verified information.

### Reflection

The final step in the LLManager flow is to perform reflection. If the request was accepted without changes, this step is skipped. This is because we do not need to reflect on a run which the LLManager got correct. If it's submitted with edits, we call the reflection subgraph, which routes the request to one of two nodes.

#### Answer correct, explanation incorrect

If the only change was to the explanation (e.g. the final answer was correct, but the human deemed the explanation behind the request to be flawed), we call the `explanation_reflection` node. This node passes the request, current reflections, original explanation, and the edited explanation to the LLM. It then prompts the LLM to reflect on why it got the correct answer, but through improper reasoning. It then generates one or more new reflections which aim to prevent the workflow from repeating this mistake.

#### Both answer and explanation are incorrect

If the human edits both the final answer and explanation, we call the `full_reflection` node. This is very similar to the above node, but instead of prompting the LLM to reflect on how it came to the correct explanation but via improper reasoning, we prompt the LLM to reflect on how it got the complete wrong answer. Once again, it generates at least one reflection to hopefully prevent this from happening again.

These generated reflections are then stored in the reflection store, and used in future requests to help the LLM generate better responses.

## Customizing

The LLManager workflow is built to work for general approval requests, but it can be easily customized for more specific use cases. The two main areas you should edit to customize the workflow are:

### Reasoning Subgraph

The reasoning subgraph is the first step in the workflow, and is responsible for generating a reasoning report on whether or not to approve the request. By default, it calls a single node and generates a "reasoning report" to be used later in the final generation. You may want to expand this subgraph to change how it creates and presents the dynamic context (few-shot examples, reflections), or how it generates the reasoning report.

### Reflection Subgraph

This is the final step in the workflow which only runs if one/both parts of the final answer (explanation or answer) was incorrect. It prompts the LLM to generate new reflections based on the incorrect answer and explanation. Editing this subgraph will allow you to have more control on how, and what reflections are generated in stored.

An example of a customization to this may be to allow the LLM to remove reflections it deems are no longer relevant, or allow it to modify existing reflections to be more accurate.
