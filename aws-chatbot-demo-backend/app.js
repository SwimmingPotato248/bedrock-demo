const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");

const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");

const client = new BedrockAgentRuntimeClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: "AKIAW3MECDGYG27M674G",
    secretAccessKey: "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",
  },
});

const agentId = "GBANRDBZ8F";
const agentAliasId = "8KP5IYOSDJ";

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
    const response = await client.send(command);

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
    res.send({ completion, references });
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
