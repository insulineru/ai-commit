<p align="center"><img width="400px" alt="Via Protocol is the most advanced cross-chain aggregation protocol" src="https://user-images.githubusercontent.com/20267733/218333677-ebdb09e5-9487-434c-92f5-f4bdcc76f632.png" width="100%">
</p>

# **AI-Commit: The Commit Message Generator**

💻 Tired of writing boring commit messages? Let AI-Commit help!

This package uses the power of OpenAI's GPT-4o-mini model to understand your code changes and generate meaningful commit messages for you. Whether you're working on a solo project or collaborating with a team, AI-Commit makes it easy to keep your commit history organized and informative.

## Demo

![ai_commit_demo(1)(2)](https://github.com/JinoArch/ai-commit/assets/39610834/3002dfa2-737a-44b9-91c9-b43907f11144)

## How it Works

1. Install AI-Commit using `npm install -g ai-commit`
2. Generate an OpenAI API key [here](https://platform.openai.com/account/api-keys)
3. Set your `AI_COMMIT_API_KEY` environment variable to your API key
4. Set `PROVIDER` in your environment to `openai` or `gemini`. Default is `openai`
5. Make your code changes and stage them with `git add .`
6. Type `ai-commit` in your terminal
7. AI-Commit will analyze your changes and generate a commit message
8. Approve the commit message and AI-Commit will create the commit for you ✅

## Using local model (ollama)

You can also use the local model for free with Ollama.

1. Install AI-Commit using `npm install -g ai-commit`
2. Install Ollama from https://ollama.ai/
3. Run `ollama run mistral` to fetch model for the first time
4. Set `PROVIDER` in your environment to `ollama`
5. Make your code changes and stage them with `git add .`
6. Type `ai-commit` in your terminal
7. AI-Commit will analyze your changes and generate a commit message
8. Approve the commit message and AI-Commit will create the commit for you ✅

## Options

`--list`: Select from a list of 5 generated messages (or regenerate the list)

`--force`: Automatically create a commit without being prompted to select a message (can't be used with `--list`)

`--filter-fee`: Displays the approximate fee for using the API and prompts you to confirm the request

`--apiKey`: Your OpenAI API key. It is not recommended to pass `apiKey` here, it is better to use `env` variable

`--emoji`: Add a gitmoji to the commit message

`--template`: Specify a custom commit message template. e.g. `--template "Modified {GIT_BRANCH} | {COMMIT_MESSAGE}"`

`--language`: Specify the language to use for the commit message(default: `english`). e.g. `--language english`

`--commit-type`: Specify the type of commit to generate. This will be used as the type in the commit message e.g. `--commit-type feat`

## Contributing

We'd love for you to contribute to AI-Commit! Here's how:

1. Fork the repository
2. Clone your fork to your local machine
3. Create a new branch
4. Make your changes
5. Commit your changes and push to your fork
6. Create a pull request to the AI-Commit repository

## Roadmap

- [x] Support for multimple suggestions: Provide multiple suggestions for the commit message.
- [x] Support for custom commit types: Allow users to specify a custom commit type manually.
- [ ] Automated scope detection: Detect the scope of changes and automatically include it in the commit message.
- [ ] Improved emoji suggestions: Enhance the emoji suggestions generated by AI-Commit to better match the changes made to the code.
- [ ] Commit message templating: Provide a customizable commit message template for users to follow.
- [ ] Interactive commit message generation: Allow users to interact with AI-Commit during the commit message generation process to provide more context and refine the generated message.
- [ ] Integration with Git hooks: Integrate AI-Commit with Git hooks so that it can automatically generate commit messages whenever changes are staged.
- [ ] Advanced diff analysis: Enhance AI-Commit's diff analysis capabilities to better understand the changes made to the code.
- [ ] Reverse commit message generation: Allow users to generate code changes from a commit message.

## License

AI-Commit is licensed under the MIT License.

## Happy coding 🚀
