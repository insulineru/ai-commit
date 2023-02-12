import { execSync } from 'child_process';
import { ChatGPTAPI } from 'chatgpt'
import inquirer from 'inquirer';
import { getArgs } from './helpers.js';

const args = getArgs();

const REGENERATE_MSG = '♻️ Regenerate Commit Messages'

const apiKey = args.apiKey || process.env.OPENAI_API_KEY || (() => {
    error('Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
})();

const api = new ChatGPTAPI({
  apiKey,
})

const makeCommit = (input) => {
  console.log('Committing Message... 🚀 ')
  execSync(`git commit -F -`, { input });
  console.log('Commit Successful! 🎉')
}

const generateSingleCommit = async () => {
  const prompt = 'I want you to act as a commit message generator. I will provide you with my code changes as a git diff and I would like you to generate an appropriate commit message. Try to understand the meaning of the changes, not just the name of the file. In our project, we use conventional commits and gitmoji to design the messages. The commit structure should be of `<emoji> <type in lowercase>: <subject>`\nHere is a list of changes:\n'

  const { text } = await api.sendMessage(prompt + diff)

  console.log(`Proposed Commit:\n------------------------------\n${text}\n------------------------------`)

  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to continue?',
        default: true,
      },
    ])
    .then((answers) => {
      if (!answers.continue) {
        console.log('Commit aborted by user 🙅‍♂️');
        process.exit(1);
      }

      makeCommit(text)
    });
}

const generateListCommits = async (diff) => {
  const prompt = 'I want you to act as a commit message generator. I will provide you with my code changes as a git diff and I would like you to generate an appropriate commit message. Generate 5 variants and send them in one line, separated by commas. Try to understand the meaning of the changes, not just the name of the file. In our project, we use conventional commits and gitmoji to design the messages. The commit structure should be of `<emoji> <type in lowercase>: <subject>`\nHere is a list of changes:\n'

  const { text } = await api.sendMessage(prompt + diff)

  const msgs = text.split(',').map((msg) => msg.trim())

  // add regenerate option
  msgs.push(REGENERATE_MSG)

  inquirer.prompt([
    {
      type: 'list',
      name: 'commit',
      message: 'Select a commit message',
      choices: msgs,
    },
  ]).then((answers) => {
    if (answers.commit === REGENERATE_MSG) {
      generateListCommits(diff)
      return
    }

    makeCommit(answers.commit)
  });
}

async function generateAICommit() {
  const diff = execSync('git diff --staged').toString()

  // Handle empty diff
  if (!diff) {
    console.log('No changes to commit 🙅');
    console.log('May be you forgot to add the files? Try `git add .` and then run this script again.')
    process.exit(1);
  }

  args.list ? await generateListCommits(diff) : await generateSingleCommit(diff)
}

generateAICommit();
