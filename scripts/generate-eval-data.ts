import "dotenv/config";
import fs from "fs";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

async function main() {
  const evalDataSchema = z.object({
    requests: z.array(z.string()).describe("The generated requests to be used to test the agent"),
  })
  const model = new ChatOpenAI({
    model: "gpt-4.5",
    temperature: 0.7,
  }).bindTools([
    {
      name: "generate_eval_data",
      schema: evalDataSchema,
      description: "Generate a dataset of requests to be used to test the agent",
    }
  ], {
    tool_choice: "generate_eval_data"
  })

  const prompt = `You're an advanced AI assistant, helping AI researchers generate a dataset for their evaluation.
You're helping them evaluate an agent who makes decisions on whether to approve/reject requests from employees at a company.

These requests should be anything an employee could ask his manager for approval for at a software company like Rakuten.

The employees could be in software, sales, marketing, etc.

Ensure each request is somewhat detailed, but not too long. These should be 2-3 sentences, and should emulate what real-life requests would look like.

Generate 5 requests.`

  const response = await model.invoke([{ role: "user", content: prompt }])

  const data = response.tool_calls?.[0]?.args?.requests as string[] | undefined;
  if (!data) {
    throw new Error("No requests generated");
  }

  await fs.promises.writeFile("./approved-requests.json", JSON.stringify(data, null, 2))
}

main().catch(console.error)