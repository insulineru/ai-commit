const ollama = {
  /**
   * send prompt to ai.
   */
  sendMessage: async (input, { apiKey, model }) => {
    //mistral as default since it's fast and clever model
    const url = "http://127.0.0.1:11434/api/generate";
    const data = {
      model: model || 'mistral',
      prompt: input,
      stream: false,
    };
    console.log("prompting ollama...", url, model);
    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const responseJson = await response.json();
      const answer = responseJson.response;
      console.log("response: ", answer);
      console.log("prompting ai done!");
      return answer;
    } catch (err) {
      console.log(err);
      throw new Error("local model issues. details:" + err.message);
    }
  },

  getPromptForSingleCommit: (diff, { commitType, language }) => {
    return (
      `Summarize this git diff into a useful, 10 words commit message in ${language}` +
      (commitType ? ` with commit type '${commitType}.'` : "") +
      ": " +
      diff
    );
  },

  getPromptForMultipleCommits: (
    diff,
    { commitType, numOptions, language }
  ) => {
    const prompt =
      "I want you to act as the author of a commit message in git." +
      `I'll enter a git diff, and your job is to convert it into a useful commit message in ${language} language` +
      (commitType ? ` with commit type '${commitType}.', ` : ", ") +
      `and make ${numOptions} options that are separated by ";".` +
      "For each option, use the present tense, return the full sentence, and use the conventional commits specification (<type in lowercase>: <subject>):" +
      diff;

    return prompt;
  },

  filterApi: ({ prompt, numCompletion = 1, filterFee }) => {
    //ollama dont have any limits and is free so we dont need to filter anything
    return true;
  }
};

export default ollama;
