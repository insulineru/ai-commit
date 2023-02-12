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

export { getArgs }
