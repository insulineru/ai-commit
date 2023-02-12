import { execSync } from 'child_process';
import { ChatGPTAPI } from 'chatgpt'
import inquirer from 'inquirer';

const getArgs = () => {
  return process.argv.slice(2)
    .reduce((args, arg) => {
      if (arg.startsWith('--')) {
        const [flag, value = true] = arg.split('=');
        args[flag.slice(2)] = value;
      } else if (arg[0] === '-') {
        arg.slice(1).split('').forEach(flag => {
          args[flag] = true;
        });
      }

      return args;
    }, {});
};

const args = getArgs();

const apiKey = args.apiKey || process.env.OPENAI_API_KEY || (() => {
    error('Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
})();

const api = new ChatGPTAPI({
  apiKey,
})

async function main() {
  const diff = execSync('git diff --staged').toString()

  const prompt = 'I want you to act as a senior Frontend developer. I will provide you with my code changes as a git diff and ask you to generate a commit message. Try to understand the meaning of the changes, not just the name of the file. In our project, we use conventional commits and gitmoji to design the messages. The commit structure should be of `<emoji> <type in lowercase>: <subject>`\nHere is a list of changes:\n'

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
        console.log('Commit aborted by user.');
        process.exit(1);
      }
      // info('Committing Message...');
      console.log('Committing Message...')
      execSync(`git commit -F -`, { input: text });
    });
}

main();