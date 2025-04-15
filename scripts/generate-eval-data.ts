import "dotenv/config";
import fs from "fs";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

async function main() {
  const evalDataSchema = z.object({
    requests: z
      .array(z.string())
      .describe("The generated requests to be used to test the agent"),
  });
  const model = new ChatOpenAI({
    model: "gpt-4.5-preview-2025-02-27",
    temperature: 0.7,
  }).bindTools(
    [
      {
        name: "generate_eval_data",
        schema: evalDataSchema,
        description:
          "Generate a dataset of requests to be used to test the agent",
      },
    ],
    {
      tool_choice: "generate_eval_data",
    },
  );

  const prompt = `You're an advanced AI assistant, helping AI researchers generate a dataset for their evaluation.
You're helping them evaluate an agent who makes decisions on whether to approve/reject requests from employees at a company.

The employees you're emulating are all software engineers.

These requests should be focused on project/product requests, specific to generative AI projects.

For example, an employee could be requesting approval to start working on integrating AI into an existing product. Your examples should be focused on this type of request.

Ensure each request is somewhat detailed, but not too long. These should be 2-3 sentences, and should emulate what real-life requests would look like.

Generate 5 requests.`;

  const response = await model.invoke([{ role: "user", content: prompt }]);

  const data = response.tool_calls?.[0]?.args?.requests as string[] | undefined;
  if (!data) {
    throw new Error("No requests generated");
  }

  await fs.promises.writeFile(
    "./approved-requests.json",
    JSON.stringify(data, null, 2),
  );
}

main().catch(console.error);
