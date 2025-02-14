import { ChatGPTAPI } from "chatgpt";

import { encode } from "gpt-3-encoder";
import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js";

const FEE_PER_1K_TOKENS = 0.02;
const MAX_TOKENS = 128000;
//this is the approximate cost of a completion (answer) fee from CHATGPT
const FEE_COMPLETION = 0.001;

const openai = {
  sendMessage: async (input, { apiKey, model = "gpt-4o-mini" }) => {
    console.log("prompting chat gpt...");
    console.log("prompt: ", input);
    const api = new ChatGPTAPI({
      apiKey,
      completionParams: {
        model,
      },
    });
    const { text } = await api.sendMessage(input);

    return text;
  },

  getPromptForSingleCommit: (
    diff,
    { commitType, customMessageConvention, language }
  ) => {
    return (
      `Write a professional git commit message based on the a diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `${
        customMessageConvention
          ? `Apply the following rules of an JSON formatted object, use key as what has to be changed and value as how it should be changes to your response: ${customMessageConvention}.`
          : ""
      }` +
      "Do not preface the commit with anything, use the present tense, return the full sentence and also commit type" +
      `${
        customMessageConvention
          ? `. Additionally apply these JSON formatted rules to your response, even though they might be against previous mentioned rules ${customMessageConvention}: `
          : ": "
      }` +
      "\n\n" +
      diff
    );
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, customMessageConvention, numOptions, language }
  ) => {
    const prompt =
      `Write a professional git commit message based on the a diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `and make ${numOptions} options that are separated by ";".` +
      "For each option, use the present tense, return the full sentence and also commit type" +
      `${
        customMessageConvention
          ? `. Additionally apply these JSON formatted rules to your response, even though they might be against previous mentioned rules ${customMessageConvention}: `
          : ": "
      }` +
      diff;

    return prompt;
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = encode(prompt).length;
    const fee =
      (numTokens / 1000) * FEE_PER_1K_TOKENS + FEE_COMPLETION * numCompletion;

    if (numTokens > MAX_TOKENS) {
      console.log(
        "The commit diff is too large for the ChatGPT API. Max 4k tokens or ~8k characters. "
      );
      return false;
    }

    if (filterFee) {
      console.log(`This will cost you ~$${+fee.toFixed(3)} for using the API.`);
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Do you want to continue 💸?",
          default: true,
        },
      ]);
      if (!answer.continue) return false;
    }

    return true;
  },
};

export default openai;
