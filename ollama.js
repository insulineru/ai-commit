const ollama = {
  /**
   * send prompt to ai.
   */
  sendMessage: async (input, { apiKey, model = 'mistral' }) => {
    const url = "http://127.0.0.1:11434/api/chat";
    const messages = [{ role: "user", content: input }];
    const data = { model, stream: false, messages };

    console.log(`Prompting Ollama with model: ${model}...`);

    try {
      // Initial request
      const initialResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const initialResult = await initialResponse.json();

      console.log("Initial answer from Ollama:", initialResult);
      const answer = initialResult.message;

      console.log("Response from Ollama:", answer.content);
      return answer.content;

    } catch (err) {
      console.error("Error during AI processing:", err.message);
      throw new Error(`Local model issues. Details: ${err.message}`);
    }
  },


  getPromptForSingleCommit: (diff, { commitType, language }) => {
    return (
      `Write a professional git commit message based on the a diff below in ${language} language` +
      (commitType ? ` with commit type '${commitType}'. ` : ". ") +
      "Do not preface the commit with anything, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>): " +
      '\n\n' +
      diff
    );
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, numOptions, language }
  ) => {
    const prompt = `Please write a professional commit message for me to push to github based on this git diff: ${diff}. Message should be in ${language} language ` + (commitType ? ` with commit type '${commitType}.', ` : ", ") +
      `and make ${numOptions} options that are separated by ";".` +
      "For each option, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):"
    return prompt;
  },

  filterApi: ({ prompt, numCompletion = 1, filterFee }) => {
    //ollama dont have any limits and is free so we dont need to filter anything
    return true;
  }
};

export default ollama;
