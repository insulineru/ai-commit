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
  const { text } = await api.sendMessage('Test connection');
}

main();
