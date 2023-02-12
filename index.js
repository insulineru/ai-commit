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

  const prompt = 'Analyze changes above and generate a short commit title, using gitmoji and conventional commits. Structure: <emoji> <type>: <subject>'

  const { text } = await api.sendMessage(`${diff}\n # ${prompt}`)

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
