import { Octokit } from "@octokit/core";
import express from "express";
import { Readable } from "node:stream";

const app = express()

app.get("/", (req, res) => {
  res.send("Ahoy, matey! Welcome to the Blackbeard Pirate GitHub Copilot Extension!")
});



app.post("/", express.json(), async (req, res) => {
  
  // Identify the user, using the GitHub API token provided in the request headers.
  console.log("req:", req);

  const url = "https://graph.microsoft.com/v1.0/copilot/retrieve";
  const headers = {
    "Authorization": "Bearer <ACCESS_TOKEN>",
    "Content-Type": "application/json",
  };
  const data = {
    query: "こんにちは",
  };
  const copilotLLMResponse = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => {
      console.log(json);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

    // Stream the response straight back to the user.
    Readable.from(copilotLLMResponse.body).pipe(res);

  const tokenForUser = req.get("X-GitHub-Token");
  const octokit = new Octokit({ auth: tokenForUser });
  const user = await octokit.request("GET /user");
  console.log("User:", user.data.login);

  // Parse the request payload and log it.
  const payload = req.body;
  console.log("Payload:", payload);

  // Insert a special pirate-y system message in our message list.
  const messages = payload.messages;
  messages.unshift({
    role: "system",
    content: "You are a helpful assistant that replies to user messages as if you were the Blackbeard Pirate.",
  });
  messages.unshift({
    role: "system",
    content: `Start every response with the user's name, which is @${user.data.login}`,
  });

  // Use Copilot's LLM to generate a response to the user's messages, with
  // our extra system messages attached.
  const githubcopilotLLMResponse = await fetch(
    "https://api.githubcopilot.com/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenForUser}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
    }
  );

  // Stream the response straight back to the user.
  Readable.from(githubcopilotLLMResponse.body).pipe(res);
})

const port = Number(process.env.PORT || '3000')
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
});