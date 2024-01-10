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

  // Extract the first alphabetic character of the commit message
  const match = commitMessage.match(/[a-zA-Z]+/);
  if(!match) return commitMessage;
  const type = match[0];

  // If the type is valid, add the corresponding gitmoji to the message
  if (typeToGitmoji[type]) {
    return `${typeToGitmoji[type]} ${commitMessage}`;
  } else {
    // If the type is not recognized, return the original message
    return commitMessage;
  }
}

export { addGitmojiToCommitMessage }
