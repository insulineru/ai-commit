import { encode } from 'gpt-3-encoder';

const MAX_TOKENS = 4000;

function filterApi(prompt) {
    const numTokens = encode(prompt).length;

    if (numTokens > MAX_TOKENS) {
        console.log("The commit diff is too large for the ChatGPT API. Max 4k tokens or ~8k characters. ");
        return false;
    }

    return true;
};

export { filterApi }
