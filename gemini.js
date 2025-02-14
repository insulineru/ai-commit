import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js";

const FEE_PER_1K_TOKENS = 0.0;
const MAX_TOKENS = 1_000_000;
const FEE_COMPLETION = 0.001;

const gemini = {
  sendMessage: async (
    input,
    { apiKey, model = "google/gemini-2.0-flash-lite-preview-02-05:free" }
  ) => {
    console.log("prompting Gemini API...");
    console.log("prompt: ", input);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: input }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  },

  getPromptForSingleCommit: (
    diff,
    { commitType, customMessageConvention, language }
  ) => {
    return (
      `Write a professional git commit message based on the diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `${
        customMessageConvention
          ? `Apply these JSON formatted rules: ${customMessageConvention}.`
          : ""
      }` +
      "Do not preface the commit with anything, use the present tense, return the full sentence and also commit type." +
      `\n\n${diff}`
    );
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, customMessageConvention, numOptions, language }
  ) => {
    return (
      `Write a professional git commit message based on the diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      `Generate ${numOptions} options separated by ";".` +
      "For each option, use the present tense, return the full sentence and also commit type." +
      `${
        customMessageConvention
          ? ` Apply these JSON formatted rules: ${customMessageConvention}.`
          : ""
      }` +
      `\n\n${diff}`
    );
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = prompt.split(" ").length; // Approximate token count
    const fee =
      (numTokens / 1000) * FEE_PER_1K_TOKENS + FEE_COMPLETION * numCompletion;

    if (numTokens > MAX_TOKENS) {
      console.log(
        "The commit diff is too large for the Gemini API. Max 128k tokens."
      );
      return false;
    }

    // if (filterFee) {
    //   console.log(`This will cost you ~$${fee.toFixed(3)} for using the API.`);
    //   const answer = await inquirer.prompt([
    //     {
    //       type: "confirm",
    //       name: "continue",
    //       message: "Do you want to continue 💸?",
    //       default: true,
    //     },
    //   ]);
    //   if (!answer.continue) return false;
    // }

    return true;
  },
};

export default gemini;
