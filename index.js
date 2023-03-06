#!/usr/bin/env node

'use strict'
import { execSync } from "child_process";
import { ChatGPTAPI } from "chatgpt";
import inquirer from "inquirer";
import { getArgs, checkGitRepository } from "./helpers.js";
import { addGitmojiToCommitMessage } from './gitmoji.js';
import { filterApi } from "./filterApi.js";

import * as dotenv from 'dotenv';
dotenv.config();

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
    "I want you to act as the author of a commit message in git."
    + "I'll enter a git diff, and your job is to convert it into a useful commit message."
    + "Do not preface the commit with anything, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):"
    + diff;

  if (!await filterApi({ prompt, filterFee: args['filter-fee'] })) process.exit(1);

  const { text } = await api.sendMessage(prompt);

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

const generateListCommits = async (diff, numOptions = 5) => {
  const prompt =
    "I want you to act as the author of a commit message in git."
    + `I'll enter a git diff, and your job is to convert it into a useful commit message and make ${numOptions} options that are separated by ";".`
    + "For each option, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):"
    + diff;

  if (!await filterApi({ prompt, filterFee: args['filter-fee'], numCompletion: numOptions })) process.exit(1);

  const { text } = await api.sendMessage(prompt);

  const msgs = text.split(";").map((msg) => msg.trim()).map(msg => addGitmojiToCommitMessage(msg));

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
  const isGitRepository = checkGitRepository();

  if (!isGitRepository) {
    console.error("This is not a git repository 🙅‍♂️");
    process.exit(1);
  }

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
