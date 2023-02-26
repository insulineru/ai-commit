import { encode } from 'gpt-3-encoder';
import inquirer from "inquirer";

const FEE_PER_1K_TOKENS = 0.02;
const MAX_TOKENS = 4000;
//this is the approximate cost of a completion (answer) fee from CHATGPT
const FEE_COMPLETION = 0.001;

async function filterApi({ prompt, numCompletion = 1, filterFee }) {
    const numTokens = encode(prompt).length;
    const fee = numTokens / 1000 * FEE_PER_1K_TOKENS + (FEE_COMPLETION * numCompletion);

    if (numTokens > MAX_TOKENS) {
        console.log("The commit diff is too large for the ChatGPT API. Max 4k tokens or ~8k characters. ");
        return false;
    }

    if (filterFee) {
        console.log(`This will cost you ~$${+fee.toFixed(3)} for using the API.`);
        const answer = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: "Do you want to continue 💸?",
                default: true,
            },
        ]);
        if (!answer.continue) return false;
    }

    return true;
};

export { filterApi }
