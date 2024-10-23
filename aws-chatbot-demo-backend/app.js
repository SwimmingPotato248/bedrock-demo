const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const BEDROCK_ACCESS_KEY = process.env.BEDROCK_ACCESS_KEY;
const BEDROCK_SECRET_ACCESS_KEY = process.env.BEDROCK_SECRET_ACCESS_KEY;
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID;
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID;

const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");

const bedrockClient = new BedrockAgentRuntimeClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: BEDROCK_ACCESS_KEY,
    secretAccessKey: BEDROCK_SECRET_ACCESS_KEY,
  },
});

const agentId = BEDROCK_AGENT_ID;
const agentAliasId = BEDROCK_AGENT_ALIAS_ID;

app.use(cors());

app.use(bodyParser.urlencoded({ limit: "20mb", extended: false }));
app.use(bodyParser.json({ limit: "20mb" }));

app.post("/", async (req, res) => {
  const query = req.body.userInput;
  const sessionId = req.body.sessionId;

  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    sessionId,
    inputText: query,
  });

  try {
    let completion = "";
    let references = [];
    const response = await bedrockClient.send(command);

    if (response.completion === undefined) {
      throw new Error("Completion is undefiend");
    }

    for await (let chunkEvent of response.completion) {
      const chunk = chunkEvent.chunk;
      const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
      completion += decodedResponse;
      if (chunkEvent.chunk?.attribution?.citations)
        references.push(
          ...chunkEvent.chunk?.attribution?.citations.map(citation => {
            return citation.retrievedReferences.map(ref => {
              return ref.location.s3Location.uri;
            });
          })
        );
    }
    references = Array.from(new Set(references.flat(Infinity)));
    console.log({ completion, references });
    res.send({ completion, references });
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
