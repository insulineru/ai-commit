#!/usr/bin/env node

'use strict'
import { execSync } from "child_process";
import { ChatGPTAPI } from "chatgpt";
import inquirer from "inquirer";
import { getArgs } from "./helpers.js";
import { addGitmojiToCommitMessage } from './gitmoji.js'

const args = getArgs();

const REGENERATE_MSG = "♻️ Regenerate Commit Messages";

const apiKey = args.apiKey || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Please set the OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const api = new ChatGPTAPI({
  apiKey,
});

const makeCommit = (input) => {
  console.log("Committing Message... 🚀 ");
  execSync(`git commit -F -`, { input });
  console.log("Commit Successful! 🎉");
};

const generateSingleCommit = async (diff) => {
  const prompt =
    "I will provide you with my code changes as a git diff and I would like you to generate an appropriate commit message. Do not write any explanations or other words, just reply with the commit message. In our project, we use conventional commits, type must be in lowercase. \nHere is a list of changes:\n";

  console.log(prompt + diff)
  const { text } = await api.sendMessage(prompt + diff);

  const gitmojiCommit = addGitmojiToCommitMessage(text);

  console.log(
    `Proposed Commit:\n------------------------------\n${gitmojiCommit}\n------------------------------`
  );

  if (args.force) {
    makeCommit(gitmojiCommit);
    return;
  }

  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "continue",
      message: "Do you want to continue?",
      default: true,
    },
  ]);

  if (!answer.continue) {
    console.log("Commit aborted by user 🙅‍♂️");
    process.exit(1);
  }

  makeCommit(gitmojiCommit);
};

const generateListCommits = async (diff) => {
  const prompt =
    "I will provide you with my code changes as a git diff and I would like you to generate an appropriate commit message. Generate 5 variants and send them in one line. Do not write any explanations or other words, just reply with the commit messages separated by commas. In our project, we use conventional commits, type must be in lowercase. Here is a list of changes:\n";

  const { text } = await api.sendMessage(prompt + diff);

  const msgs = text.split(",").map((msg) => msg.trim()).map(msg => addGitmojiToCommitMessage(msg));

  // add regenerate option
  msgs.push(REGENERATE_MSG);

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "commit",
      message: "Select a commit message",
      choices: msgs,
    },
  ]);

  if (answer.commit === REGENERATE_MSG) {
    await generateListCommits(diff);
    return;
  }

  makeCommit(answer.commit);
};

async function generateAICommit() {
  const diff = execSync("git diff --staged").toString();

  // Handle empty diff
  if (!diff) {
    console.log("No changes to commit 🙅");
    console.log(
      "May be you forgot to add the files? Try git add . and then run this script again."
    );
    process.exit(1);
  }


  args.list
    ? await generateListCommits(diff)
    : await generateSingleCommit(diff);
}

await generateAICommit();
