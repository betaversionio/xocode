/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...require("./base"),
  env: { browser: true, es2022: true },
  extends: [...(require("./base").extends || []), "plugin:react-hooks/recommended"],
  rules: {
    ...require("./base").rules,
    "react/react-in-jsx-scope": "off",
  },
};
