const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");

const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} = require("@aws-sdk/client-bedrock-agent-runtime");
const { S3Client } = require("@aws-sdk/client-s3");

const bedrockClient = new BedrockAgentRuntimeClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: "AKIAW3MECDGYG27M674G",
    secretAccessKey: "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",
  },
});

const s3Client = new S3Client({
  region: "us-west-2",
  credentials: {
    accessKeyId: "AKIAW3MECDGYG27M674G",
    secretAccessKey: "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",
  },
});

const agentId = "GBANRDBZ8F";
const agentAliasId = "N9PKSMG5FK";

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

    references = references.map(ref => {
      return {
        fileName: "Cẩm nang du lịch Hàn Quốc.docx",
        url: "https://bedrock-knowledge-base-bucket-osam.s3.us-west-2.amazonaws.com/C%E1%BA%A9m%20nang%20du%20l%E1%BB%8Bch%20H%C3%A0n%20Qu%E1%BB%91c.docx?response-content-disposition=attachment&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEBAaDmFwLXNvdXRoZWFzdC0yIkYwRAIgDX91P8oYf3fAsQJ9EFULhu3fdl1yyH%2FbwTbiJNCE3ocCIDLaKVI6DFTKGd0rdgVQp%2BAJ3gnPPZH5svCgBNIk3WZ9Ku0CCLn%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNDcxMTEyNzUxNTM2IgwHqvcq9kwglbno1lEqwQJNCnim0V3owtsOCQLTDgu3N1yvawM8YJmbpZf3T%2FNLyK1PZYRqO11MHmbEAyjUzJFWtadfq5JNbqOqF1tjpSL0QuSYVrGqfo8g7TMBCZVhp0vim7MS7BxfmL9HbG8vM0GvbYWwECHi4NSLp2EKF2G3kPUXTpVFnV5ed%2Bp5N56Xvj1IAXCWWKMN3Y943CEffv2KH8xyHgPbzVpEOsX0QpikNo7yZT8MRGSipDsLfIpGQAWRK%2Fv6DD%2F8OocA6rv8IMld6kYQcp7TfLANYg1WbDsTQkc75cgVMXRYzkh%2BAc9deejHQPEglfuZGhxO5GpIJcO12bxcR5SNGbCAf0HOjq2qR4tpOtIRvIixYRFM2j7yY%2BVul5%2FZy3TEe0MlDtuH40kjVwPDDGHaMkvV84icrPD0R6UlT%2BCuw3HLU9jCRZ4JBcEw1OToswY6tAIBrBFMN1d5cGu6YH%2Byw7a3cDzFYn2SVNc5WbfbS0dXuda6qo7C45DFbNqwQIsD%2BbMM6mOs7kJKtTYOJtE%2Fae9RubBoqXGiRAUnvqDBY%2BJwKjPYg4H5LzqSimKWJ48s5ccYnXeld%2BbiGOuO3wpvPY2d27RKkfqItYDRxlvzfalWZRK4Hs5DnUgiklZUQQLduXCywEDMugz6hrsE7EQA8aIeGm2RjEQ35apdk%2Bjjo7gPIpdy1WcLab3ScE9Bes7q2eyLvrK2h4UyyZHnxDRYwjpF8I9QMWjyMEuRjghIxTkO%2FA7CcpWIZa7uhumBV%2FhpE9RowssLAACgYPiWHFpTdHXkjwNA%2FGWLoiUhSjr%2BF0oh%2BzJr6iVT30tPEDESNsKID1mXu3vQ5P7CcFOIeoy5pHVYN1HLaw%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240625T111410Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAW3MECDGYDMQAG4XA%2F20240625%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=db1ae0964c1f250db9dc15b0c51043da8a44930fed096ead3e2a42b56ea30a87",
      };
    });
    res.send({ completion, references });
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
