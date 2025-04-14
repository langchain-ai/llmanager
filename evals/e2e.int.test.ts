import { v4 as uuidv4 } from "uuid";
import * as ls from "langsmith/jest";
import { HumanMessage } from "@langchain/core/messages";
import { Client } from "@langchain/langgraph-sdk";

const inputs = [
  {
    inputs: {
      messages: [
        new HumanMessage(
          "I would like to request approval to attend the AWS re:Invent conference next month. This will help me stay updated with the latest cloud technologies, which are directly relevant to our ongoing projects.",
        ),
      ],
    },
  },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Could I have permission to access the company's AWS account to perform testing on the new deployment pipeline? This access is essential for integrating and verifying recent development tasks.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'm requesting approval to enroll in an advanced JavaScript training course. This training will significantly boost my frontend development skills, directly benefiting our current web projects.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Can I get authorization to purchase a new software license for JetBrains IntelliJ IDEA? My current IDE license is about to expire, and continued access is vital for my daily development work.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I would like to request approval for a two-week extension on the upcoming project deadline. Recent unforeseen technical challenges require extra time to ensure quality delivery.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request to work remotely for the next two weeks due to personal circumstances. My productivity and availability will remain unchanged during this period.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Can I have approval to upgrade my current laptop to a more powerful model? My existing machine is struggling with resource-intensive tasks, reducing my productivity.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'm requesting permission to join the internal machine learning workshop next week. This knowledge aligns closely with my project responsibilities and will enhance my team's effectiveness.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Could you approve my request for a day off next Friday? I have personal matters to attend to and will ensure all my duties are covered beforehand.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request to renew my professional certification in cybersecurity. Maintaining this certification is essential for compliance with our security policy.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I would like permission to conduct a code refactoring session for our legacy software module. This initiative aims to improve the maintainability and performance of our system.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Can I request approval to collaborate with an external consultant on our next software architecture review? Their expertise can provide valuable insights into improving our system's scalability.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'm requesting to attend a one-day seminar on Agile project management. It will help me implement more effective practices within our team.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request for access to the beta version of the new API framework we're planning to adopt. Early access will allow me to start evaluating its potential benefits and challenges.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'd like approval to take a half-day off next Wednesday for a healthcare appointment. I'll ensure my tasks are on schedule and will make up for the lost hours later.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Can I get approval to purchase a subscription to an online learning platform such as Pluralsight? This will facilitate continuous learning and skill improvement relevant to my role.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request to shift my work hours temporarily from 10 am to 6 pm for the next month. This adjustment will help me better coordinate with our overseas team.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'm requesting permission to set up a new staging environment for our latest software update. This environment will enable thorough testing and reduce the risk of deployment issues.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Could you approve my participation in a hackathon focused on emerging technologies? It will enhance my skills and provide creative solutions beneficial to our projects.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'd like to request approval to use the corporate credit card for purchasing a new ergonomic office chair. My current chair is causing discomfort, impacting my productivity.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request to take part in the company's mentorship program as a mentor. This will help me develop leadership skills and contribute positively to our team culture.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'm requesting approval to initiate a minor budget allocation for team-building activities. This will help boost morale and collaboration among our team members.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Can I get authorization to submit a proposal for implementing an automated testing framework? This will enhance our software quality assurance and reduce manual testing time.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "Please approve my request to work from home on Fridays regularly. I have found that I can be more productive and focused on specific tasks when working remotely.",
  //       ),
  //     ],
  //   },
  // },
  // {
  //   inputs: {
  //     messages: [
  //       new HumanMessage(
  //         "I'd like approval to attend a training session on database optimization techniques. This knowledge is directly applicable to improving our current database performance.",
  //       ),
  //     ],
  //   },
  // },
];

ls.describe("LLManager", () => {
  const client = new Client({
    apiUrl: "http://localhost:2024",
  });

  let assistantId = "";

  // ls.test.each(inputs)("E2E Test", async ({ inputs }) => {
  //   const threadId = uuidv4();
  //   const assistantId = uuidv4();
  //   const config: LangGraphRunnableConfig = {
  //     configurable: {
  //       assistant_id: assistantId,
  //       thread_id: threadId,
  //       approvalCriteria: undefined,
  //       rejectionCriteria: undefined,
  //     },
  //   };
  //   const store = new InMemoryStore();
  //   const checkpointer = new MemorySaver();
  //   graph.checkpointer = checkpointer;
  //   graph.store = store;
  //   const result = await graph.invoke(inputs, config as any);
  //   console.log(result);
  //   // await client.runs.wait(threadId, assistantId, {
  //   //   ifNotExists: "create",
  //   //   input: inputs,
  //   // });
  // });

  beforeAll(async () => {
    const assistant = await client.assistants.create({
      graphId: "agent",
    });
    assistantId = assistant.assistant_id;
  });

  ls.test.each(inputs)("E2E Test", async ({ inputs }) => {
    const threadId = uuidv4();
    const result = await client.runs.wait(threadId, assistantId, {
      input: inputs,
      ifNotExists: "create",
    });
    console.log(result);
  });
});
