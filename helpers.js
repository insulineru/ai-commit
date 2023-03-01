const getArgs = () => {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const key = arg.replace(/^--/, '');
    const nextArg = args[i + 1];
    if (/^--/.test(nextArg) || nextArg === undefined) {
      result[key] = true;
    } else {
      result[key] = nextArg;
      i++;
    }
  }

  return result;
};

export { getArgs }
