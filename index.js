#!/usr/bin/env node

'use strict'
import { execSync } from "child_process";
import inquirer from "inquirer";
import { getArgs, checkGitRepository } from "./helpers.js";
import { addGitmojiToCommitMessage } from './gitmoji.js';
import { AI_PROVIDER, MODEL, args } from "./config.js"
import openai from "./openai.js"
import ollama from "./ollama.js"
import { encode } from 'gpt-3-encoder';

const REGENERATE_MSG = "♻️ Regenerate Commit Messages";
const MAX_TOKENS = 128000;

console.log('Ai provider: ', AI_PROVIDER);

const ENDPOINT = args.ENDPOINT || process.env.ENDPOINT

const apiKey = args.apiKey || process.env.OPENAI_API_KEY;

const language = args.language || process.env.AI_COMMIT_LANGUAGE || 'english';

if (AI_PROVIDER === 'openai' && !apiKey) {
  console.error("Please set the OPENAI_API_KEY environment variable.");
  process.exit(1);
}

let template = args.template || process.env.AI_COMMIT_COMMIT_TEMPLATE
const doAddEmoji = args.emoji || process.env.AI_COMMIT_ADD_EMOJI

const commitType = args['commit-type'];

const provider = AI_PROVIDER === 'ollama' ? ollama : openai

const processTemplate = ({ template, commitMessage }) => {
  if (!template.includes('COMMIT_MESSAGE')) {
    console.log(`Warning: template doesn't include {COMMIT_MESSAGE}`)

    return commitMessage;
  }

  let finalCommitMessage = template.replaceAll("{COMMIT_MESSAGE}", commitMessage);

  if (finalCommitMessage.includes('GIT_BRANCH')) {
    const currentBranch = execSync("git branch --show-current").toString().replaceAll("\n", "");

    console.log('Using currentBranch: ', currentBranch);

    finalCommitMessage = finalCommitMessage.replaceAll("{GIT_BRANCH}", currentBranch)
  }

  return finalCommitMessage;
}

const makeCommit = (input) => {
  console.log("Committing Message... 🚀 ");
  execSync(`git commit -F -`, { input });
  console.log("Commit Successful! 🎉");
};


const processEmoji = (msg, doAddEmoji) => {
  if (doAddEmoji) {
    return addGitmojiToCommitMessage(msg);
  }

  return msg;
}

const getPromptForSingleCommit = (diff) => {
  return provider.getPromptForSingleCommit(diff, { commitType, language })
};

const generateSingleCommit = async (diff) => {
  const prompt = getPromptForSingleCommit(diff)
  console.log(prompt)
  if (!await provider.filterApi({ prompt, filterFee: args['filter-fee'] })) process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey, model: MODEL });

  let finalCommitMessage = processEmoji(text, args.emoji);

  if (args.template) {
    finalCommitMessage = processTemplate({
      template: args.template,
      commitMessage: finalCommitMessage,
    })

    console.log(
      `Proposed Commit With Template:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );
  } else {

    console.log(
      `Proposed Commit:\n------------------------------\n${finalCommitMessage}\n------------------------------`
    );

  }

  if (args.force) {
    makeCommit(finalCommitMessage);
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

  makeCommit(finalCommitMessage);
};

const generateListCommits = async (diff, numOptions = 5) => {
  const prompt = provider.getPromptForMultipleCommits(diff, { commitType, numOptions, language })
  if (!await provider.filterApi({ prompt, filterFee: args['filter-fee'], numCompletion: numOptions })) process.exit(1);

  const text = await provider.sendMessage(prompt, { apiKey, model: MODEL });

  let msgs = text.split(";").map((msg) => msg.trim()).map(msg => processEmoji(msg, args.emoji));

  if (args.template) {
    msgs = msgs.map(msg => processTemplate({
      template: args.template,
      commitMessage: msg,
    }))
  }

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

// Добавьте эту функцию после импортов
const filterLockFiles = (diff) => {
  const lines = diff.split('\n');
  let isLockFile = false;
  const filteredLines = lines.filter(line => {
    if (line.match(/^diff --git a\/(.*\/)?(yarn\.lock|pnpm-lock\.yaml|package-lock\.json)/)) {
      isLockFile = true;
      return false;
    }
    if (isLockFile && line.startsWith('diff --git')) {
      isLockFile = false;
    }
    return !isLockFile;
  });
  return filteredLines.join('\n');
};

function parseDiffByFile(diff) {
  const files = [];
  const lines = diff.split('\n');
  let currentFile = null;
  let currentDiff = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const diffGitMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (diffGitMatch) {
      // Début d'un nouveau fichier
      if (currentFile) {
        files.push({ filename: currentFile, diff: currentDiff.join('\n') });
      }
      currentFile = diffGitMatch[2];
      currentDiff = [line];
    } else if (currentFile) {
      currentDiff.push(line);
    }
  }
  // Ajouter le dernier fichier
  if (currentFile && currentDiff.length) {
    files.push({ filename: currentFile, diff: currentDiff.join('\n') });
  }
  return files;
}


async function generateAICommit() {
  const isGitRepository = checkGitRepository();

  if (!isGitRepository) {
    console.error("This is not a git repository 🙅‍♂️");
    process.exit(1);
  }

  let diff = execSync("git diff --staged").toString();

  // Filter lock files
  const originalDiff = diff;
  diff = filterLockFiles(diff);

  // Check if lock files were changed
  if (diff !== originalDiff) {
    console.log("Changes detected in lock files. These changes will be included in the commit but won't be analyzed for commit message generation.");
  }

  // Handle empty diff after filtering
  if (!diff.trim()) {
    console.log("No changes to commit except lock files 🙅");
    console.log("Maybe you forgot to add files? Try running git add . and then run this script again.");
    process.exit(1);
  }

  const prompt = getPromptForSingleCommit(diff);

  const numTokens = encode(prompt).length;

  if (numTokens > MAX_TOKENS) {
    // Diviser le diff par fichier et générer des résumés
    console.log("The commit diff is too large for the ChatGPT API. Splitting by files...");

    // Parse diff into per-file diffs
    const fileDiffs = parseDiffByFile(diff);

    const summaries = [];

    for (const { filename, diff: fileDiff } of fileDiffs) {
      const summaryPrompt = provider.getPromptForDiffSummary(fileDiff, filename, { language });
      const numTokens = encode(summaryPrompt).length;

      if (numTokens > MAX_TOKENS) {
        console.log(`Skipping ${filename} because its diff is too large.`);
        continue;
      }

      if (!await provider.filterApi({ prompt: summaryPrompt, filterFee: args['filter-fee'] })) continue;

      const summary = await provider.sendMessage(summaryPrompt, { apiKey, model: MODEL });

      summaries.push(`- **${filename}**: ${summary}`);
    }

    if (summaries.length === 0) {
      console.log("No files to summarize.");
      process.exit(1);
    }

    // Générer le message de commit à partir des résumés
    const summariesText = summaries.join('\n');

    const commitPrompt =
        `Based on the following summaries of changes, create a useful commit message in ${language} language` +
        (commitType ? ` with commit type '${commitType}'. ` : ". ") +
        "Use the summaries below to create the commit message. Do not preface the commit with anything, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):\n\n" +
        summariesText;

    if (!await provider.filterApi({ prompt: commitPrompt, filterFee: args['filter-fee'] })) process.exit(1);

    const commitMessage = await provider.sendMessage(commitPrompt, { apiKey, model: MODEL });

    let finalCommitMessage = processEmoji(commitMessage, args.emoji);

    if (args.template) {
      finalCommitMessage = processTemplate({
        template: args.template,
        commitMessage: finalCommitMessage,
      })

      console.log(
          `Proposed Commit With Template:\n------------------------------\n${finalCommitMessage}\n------------------------------`
      );
    } else {
      console.log(
          `Proposed Commit:\n------------------------------\n${finalCommitMessage}\n------------------------------`
      );
    }

    if (args.force) {
      makeCommit(finalCommitMessage);
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

    makeCommit(finalCommitMessage);

  } else {
    // Procéder comme d'habitude si le diff n'est pas trop grand
    args.list
        ? await generateListCommits(diff)
        : await generateSingleCommit(diff);
  }
}

await generateAICommit();
