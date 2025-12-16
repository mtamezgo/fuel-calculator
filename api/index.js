const { createRequestHandler } = require("@react-router/node");
const build = require("../build/server/index.js");

const handler = createRequestHandler({ build });

module.exports = async (req, res) => {
  return handler(req, res);
};
