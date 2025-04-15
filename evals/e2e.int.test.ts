import { v4 as uuidv4 } from "uuid";
import * as ls from "langsmith/jest";
import { Client } from "@langchain/langgraph-sdk";

const inputs = [
  {
    inputs: {
      query:
        "I'd like approval to explore integrating generative AI into our customer support chatbot. This could significantly improve response accuracy and customer satisfaction. I plan to start with a prototype to evaluate potential impacts.",
    },
  },
  {
    inputs: {
      query:
        "Requesting permission to initiate a small-scale pilot project using generative AI to enhance our code review system. This could automate routine checks and free up engineers to focus on complex issues. I'll provide regular updates on the pilot’s progress.",
    },
  },
  {
    inputs: {
      query:
        "I'm seeking approval to research and potentially implement generative AI for automatically generating documentation for our APIs. This initiative could greatly reduce manual documentation efforts and improve consistency across our products.",
    },
  },
  {
    inputs: {
      query:
        "I propose we explore using generative AI to create synthetic datasets for testing our software products. This method could improve our test coverage and help detect bugs earlier. I'd like authorization to proceed with initial experiments.",
    },
  },
  {
    inputs: {
      query:
        "Requesting approval to integrate generative AI into our existing software development pipeline for automatic code generation. This could improve developer productivity and reduce the time spent on repetitive coding tasks.",
    },
  },
  {
    inputs: {
      query:
        "I would like to request approval to attend the AWS re:Invent conference next month. This will help me stay updated with the latest cloud technologies, which are directly relevant to our ongoing projects.",
    },
  },
  {
    inputs: {
      query:
        "Could I have permission to access the company's AWS account to perform testing on the new deployment pipeline? This access is essential for integrating and verifying recent development tasks.",
    },
  },
  {
    inputs: {
      query:
        "I'm requesting approval to enroll in an advanced JavaScript training course. This training will significantly boost my frontend development skills, directly benefiting our current web projects.",
    },
  },
  {
    inputs: {
      query:
        "Can I get authorization to purchase a new software license for JetBrains IntelliJ IDEA? My current IDE license is about to expire, and continued access is vital for my daily development work.",
    },
  },
  {
    inputs: {
      query:
        "I would like to request approval for a two-week extension on the upcoming project deadline. Recent unforeseen technical challenges require extra time to ensure quality delivery.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request to work remotely for the next two weeks due to personal circumstances. My productivity and availability will remain unchanged during this period.",
    },
  },
  {
    inputs: {
      query:
        "Can I have approval to upgrade my current laptop to a more powerful model? My existing machine is struggling with resource-intensive tasks, reducing my productivity.",
    },
  },
  {
    inputs: {
      query:
        "I'm requesting permission to join the internal machine learning workshop next week. This knowledge aligns closely with my project responsibilities and will enhance my team's effectiveness.",
    },
  },
  {
    inputs: {
      query:
        "Could you approve my request for a day off next Friday? I have personal matters to attend to and will ensure all my duties are covered beforehand.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request to renew my professional certification in cybersecurity. Maintaining this certification is essential for compliance with our security policy.",
    },
  },
  {
    inputs: {
      query:
        "I would like permission to conduct a code refactoring session for our legacy software module. This initiative aims to improve the maintainability and performance of our system.",
    },
  },
  {
    inputs: {
      query:
        "Can I request approval to collaborate with an external consultant on our next software architecture review? Their expertise can provide valuable insights into improving our system's scalability.",
    },
  },
  {
    inputs: {
      query:
        "I'm requesting to attend a one-day seminar on Agile project management. It will help me implement more effective practices within our team.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request for access to the beta version of the new API framework we're planning to adopt. Early access will allow me to start evaluating its potential benefits and challenges.",
    },
  },
  {
    inputs: {
      query:
        "I'd like approval to take a half-day off next Wednesday for a healthcare appointment. I'll ensure my tasks are on schedule and will make up for the lost hours later.",
    },
  },
  {
    inputs: {
      query:
        "Can I get approval to purchase a subscription to an online learning platform such as Pluralsight? This will facilitate continuous learning and skill improvement relevant to my role.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request to shift my work hours temporarily from 10 am to 6 pm for the next month. This adjustment will help me better coordinate with our overseas team.",
    },
  },
  {
    inputs: {
      query:
        "I'm requesting permission to set up a new staging environment for our latest software update. This environment will enable thorough testing and reduce the risk of deployment issues.",
    },
  },
  {
    inputs: {
      query:
        "Could you approve my participation in a hackathon focused on emerging technologies? It will enhance my skills and provide creative solutions beneficial to our projects.",
    },
  },
  {
    inputs: {
      query:
        "I'd like to request approval to use the corporate credit card for purchasing a new ergonomic office chair. My current chair is causing discomfort, impacting my productivity.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request to take part in the company's mentorship program as a mentor. This will help me develop leadership skills and contribute positively to our team culture.",
    },
  },
  {
    inputs: {
      query:
        "I'm requesting approval to initiate a minor budget allocation for team-building activities. This will help boost morale and collaboration among our team members.",
    },
  },
  {
    inputs: {
      query:
        "Can I get authorization to submit a proposal for implementing an automated testing framework? This will enhance our software quality assurance and reduce manual testing time.",
    },
  },
  {
    inputs: {
      query:
        "Please approve my request to work from home on Fridays regularly. I have found that I can be more productive and focused on specific tasks when working remotely.",
    },
  },
  {
    inputs: {
      query:
        "I'd like approval to attend a training session on database optimization techniques. This knowledge is directly applicable to improving our current database performance.",
    },
  },
];

ls.describe("LLManager", () => {
  const client = new Client({
    apiUrl: "http://localhost:2024",
  });
  let assistantId = "";

  beforeAll(async () => {
    const assistant = await client.assistants.create({
      graphId: "agent",
    });
    assistantId = assistant.assistant_id;

    console.log("Using assistant ID:", assistantId);
  });

  ls.test.each(inputs.slice(0, 4))("E2E Test", async ({ inputs }) => {
    const threadId = uuidv4();
    const result = await client.runs.wait(threadId, assistantId, {
      input: inputs,
      ifNotExists: "create",
    });
    console.log(result);
  });
});
