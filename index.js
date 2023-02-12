import { execSync } from 'child_process';
import { ChatGPTAPI } from 'chatgpt'
import inquirer from 'inquirer';

const apiKey = process.argv.at(0) || (() => {
    error('Please set the OPENAI_API_KEY environment variable.');
    process.exit(1);
})();

const api = new ChatGPTAPI({
  apiKey,
})
