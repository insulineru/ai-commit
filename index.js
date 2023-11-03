#!/usr/bin/env node

'use strict'
import { execSync } from "child_process";
import { ChatGPTAPI } from "chatgpt";
import inquirer from "inquirer";
import { getArgs, checkGitRepository } from "./helpers.js";
import { addGitmojiToCommitMessage } from './gitmoji.js';
import { filterApi } from "./filterApi.js";
import { AI_PROVIDER, MODEL, args } from "./config.js"



const REGENERATE_MSG = "♻️ Regenerate Commit Messages";



console.log('Ai provider: ', AI_PROVIDER);

const ENDPOINT = args.ENDPOINT || process.env.ENDPOINT

const apiKey = args.apiKey || process.env.OPENAI_API_KEY;


if (AI_PROVIDER == 'openai') {
  console.error("Please set the OPENAI_API_KEY environment variable.");
  process.exit(1);
}



let template = args.template || process.env.AI_COMMIT_COMMIT_TEMPLATE
const doAddEmoji = args.emoji || process.env.AI_COMMIT_ADD_EMOJI

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

/** 
 * send prompt to ai.
 */
const sendMessage = async (input) => {
  if (AI_PROVIDER == 'ollama') {
    //orca-mini as default since it's fast and lightweight model
    const model = MODEL || 'orca-mini'
    const url = 'http://localhost:11434/api/generate'
    const data = {
      model,
      prompt: input,
      stream: false
    }
    console.log('prompting ollama...', url, model)
    try {
      const response = await fetch(url, {

        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },

      })
      const responseJson=await response.json();
      const answer = responseJson.response
      console.log('response: ', answer)
      console.log('prompting ai done!')
      return answer
    } catch (err) {
      throw new Error('local model issues. details:' + err.message)
    }
  }

  if (AI_PROVIDER == 'openai') {

    console.log('prompting chat gpt...')
    const api = new ChatGPTAPI({
      apiKey,
    });
    const { text } = await api.sendMessage(input);
    console.log('prompting ai done!')
    return text

  }

}

const getPromptForSingleCommit = (diff)=>{
  if(AI_PROVIDER=='openai') {
    const prompt =
    "I want you to act as the author of a commit message in git."
    + "I'll enter a git diff, and your job is to convert it into a useful commit message."
    + "Do not preface the commit with anything, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):"
    + diff;
    return prompt;
  }
  if(AI_PROVIDER=='ollama') {
    //weaker ai so need to use simpler prompt maybe
    return 'summarize this git diff in 10 words: ' + diff 
  }
}

const generateSingleCommit = async (diff) => {
  const prompt = getPromptForSingleCommit(diff)

  if (!await filterApi({ prompt, filterFee: args['filter-fee'] })) process.exit(1);

  const text = await sendMessage(prompt);

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
  const prompt =
    "I want you to act as the author of a commit message in git."
    + `I'll enter a git diff, and your job is to convert it into a useful commit message and make ${numOptions} options that are separated by ";".`
    + "For each option, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):"
    + diff;

  if (!await filterApi({ prompt, filterFee: args['filter-fee'], numCompletion: numOptions })) process.exit(1);

  const text = await sendMessage(prompt);

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
