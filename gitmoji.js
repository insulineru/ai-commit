function addGitmojiToCommitMessage(commitMessage) {
  // Define the mapping of commit types to gitmojis
  const typeToGitmoji = {
    feat: "✨",
    fix: "🚑",
    docs: "📝",
    style: "💄",
    refactor: "♻️",
    test: "✅",
    chore: "🔧",
  };

  // Split the commit message into its parts
  const [type, ...rest] = commitMessage.split(": ");

  // If the type is valid, add the corresponding gitmoji to the message
  if (typeToGitmoji[type]) {
    return `${typeToGitmoji[type]} ${type}: ${rest.join(": ")}`;
  } else {
    // If the type is not recognized, return the original message
    return commitMessage;
  }
}

export { addGitmojiToCommitMessage }
