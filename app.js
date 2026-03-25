import fs from "fs";
import dotenv from "dotenv";
import Groq from "groq-sdk";

// Load environment variables
dotenv.config({ path: "./.env" });

// Initialize Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Get input from file OR stdin
async function getInput() {
  const filePath = process.argv[2];

  if (filePath) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      throw new Error("Failed to read file.");
    }
  }

  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// Call LLM
// async function summarize(text) {
//   if (!text.trim()) {
//     throw new Error("Input text is empty.");
//   }

//   try {
//     const response = await client.chat.completions.create({
//       model: "llama-3.3-70b-versatile",
//       messages: [
//         {
//           role: "user",
//           content: `
// Return ONLY valid JSON (no explanation):

// {
//   "summary": "...",
//   "key_points": ["...", "...", "..."],
//   "sentiment": "positive | neutral | negative"
// }

// Text:
// """${text}"""
//           `,
//         },
//       ],
//     });

//     let content = response.choices[0].message.content;

//     // Remove markdown formatting if present
//     content = content.replace(/```json|```/g, "").trim();

//     // Parse safely
//     try {
//       return JSON.parse(content);
//     } catch {
//       console.error("Raw model output:", content);
//       throw new Error("Invalid JSON returned by model.");
//     }
//   } catch (err) {
//     console.error("FULL ERROR:", err);
//     throw new Error("LLM request failed.");
//   }
// }


async function summarize(text) {
  if (!text.trim()) {
    throw new Error("Input text is empty.");
  }

  try {
//     const response = await client.chat.completions.create({
//       model: "llama-3.3-70b-versatile",
//       messages: [
//         {
//           role: "user",
//           content: `
// You must return ONLY valid JSON. No explanation.

// Format:
// {
//   "summary": "one sentence summary",
//   "key_points": ["point 1", "point 2", "point 3"],
//   "sentiment": "positive | neutral | negative"
// }

// Text:
// """${text}"""
//           `,
//         },
//       ],
//     });


const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  messages: [
    {
      role: "system",
      content: "You are a strict JSON generator. Always return valid JSON only."
    },
    {
      role: "user",
      content: `
Return ONLY valid JSON. No explanation.

{
  "summary": "one sentence summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "sentiment": "positive | neutral | negative"
}

Text:
"""${text}"""
      `
    }
  ],
});

    // let content = response.choices[0].message.content;
    // content = content.replace(/```json|```/g, "").trim();

    // try {
    //   return JSON.parse(content);
    // } catch {
    //   console.log("Raw output:", content);
    //   return {
    //     summary: content.slice(0, 100),
    //     key_points: ["Parsing failed"],
    //     sentiment: "unknown",
    //   };
    // }

    let content = response.choices[0].message.content;

content = content.replace(/```json|```/g, "").trim();

// Extract JSON safely
const jsonStart = content.indexOf("{");
const jsonEnd = content.lastIndexOf("}");

if (jsonStart !== -1 && jsonEnd !== -1) {
  content = content.substring(jsonStart, jsonEnd + 1);
}

try {
  return JSON.parse(content);
} catch {
  console.log("Raw output:", content);
  return {
    summary: content.slice(0, 100),
    key_points: ["Parsing failed"],
    sentiment: "unknown",
  };
}



  } catch (err) {
    console.error("FULL ERROR:", err);
    throw new Error("LLM request failed.");
  }
}

// Print nicely
function printOutput(result) {
  console.log("\n================ RESULT ================\n");

  console.log("Summary:");
  console.log(result.summary || "N/A");

  console.log("\nKey Points:");
  (result.key_points || []).forEach((point, i) => {
    console.log(`${i + 1}. ${point}`);
  });

  console.log("\nSentiment:");
  console.log(result.sentiment || "N/A");

  console.log("\n========================================\n");
}

// Main
(async () => {
  try {
    const input = await getInput();
    const result = await summarize(input);
    printOutput(result);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();