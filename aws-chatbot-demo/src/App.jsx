import { useState } from "react";
import "./App.css";
import Markdown from "markdown-to-jsx";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
const sessionId = uuidv4();

import Logo from "./assets/logo_osam.png";

function App() {
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const onPrompt = async () => {
    if (!prompt) return;
    setIsLoading(true);
    axios({
      url: "http://localhost:3000",
      method: "post",
      data: { userInput: prompt, sessionId },
      headers: { "Referrer-Policy": "no-referrer" },
    }).then(res => {
      setConversation(prev => {
        return [
          ...prev,
          {
            message: "reply",
            content: res.data.completion,
            // references: res.data.references,
          },
        ];
      });
      setIsLoading(false);
    });
    setConversation(prev => {
      return [...prev, { message: "userInput", content: prompt }];
    });
    setPrompt("");
    window.scrollTo(0, document.body.scrollHeight);
  };
  return (
    <>
      <img src={Logo} alt="" />
      <div
        style={{
          maxWidth: "1600px",
          width: "80%",
          margin: "0 auto",
          height: "80%",
          minHeight: "800px",
          display: "flex",
          position: "relative",
          flexGrow: 1,
          flexDirection: "column",
          border: "1px solid gray",
        }}
      >
        <button onClick={() => setConversation([])}>Xóa lịch sử</button>

        <div
          style={{
            width: "100%",
            margin: "0 auto",
            paddingBottom: "80px",
            flexShrink: 1,
          }}
        >
          {conversation.map((e, i) => {
            if (e.message === "userInput") {
              return (
                <div key={i}>
                  <p
                    style={{
                      backgroundColor: "#ddd",
                      padding: "12px",
                      fontSize: "18px",
                    }}
                  >
                    {e.content}
                  </p>
                </div>
              );
            }
            return (
              <div key={i} style={{}}>
                <div style={{ padding: "12px" }}>
                  <Markdown>{e.content}</Markdown>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                    marginTop: "24px",
                  }}
                >
                  {e.references?.map((ref, i) => {
                    return (
                      <div
                        key={ref.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "#eee" : "#fff",
                          padding: "12px",
                        }}
                      >
                        <a
                          href={ref.url}
                          style={{
                            textOverflow: "ellipsis",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          }}
                          target="_blank"
                        >
                          <span>[{i + 1}] </span>
                          {ref.fileName}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div
              style={{
                padding: "12px",
                fontSize: "18px",
                color: "teal",
                fontWeight: "bold",
                height: "700px",
              }}
            >
              Agent đang trả lời
            </div>
          )}
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            onPrompt();
          }}
        >
          <div
            style={{
              position: "fixed",
              bottom: "10px",
              width: "80%",
              maxWidth: "1600px",
              display: "flex",
            }}
          >
            <input
              style={{
                width: "100%",
                borderRadius: "10px",
                height: "3rem",
                fontSize: "24px",
                padding: "4px 12px",
              }}
              placeholder="Nhập nội dung chat"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <button>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ height: "16px", width: "16px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default App;
