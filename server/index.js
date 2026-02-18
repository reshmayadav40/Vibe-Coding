const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper to convert file to generative part
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

app.post('/api/convert-flowchart', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No image uploaded.');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this flowchart image and convert it into a structured JSON format compatible with React Flow.
      Each node should have an id, type (input, output, process, decision, start, end), data (with a label), and a suggested position (x, y).
      Each edge should have an id, source, and target.

      Return ONLY a JSON object with "nodes" and "edges" keys.
      Example structure:
      {
        "nodes": [
          { "id": "1", "type": "input", "data": { "label": "Start" }, "position": { "x": 250, "y": 0 } },
          ...
        ],
        "edges": [
          { "id": "e1-2", "source": "1", "target": "2" },
          ...
        ]
      }
    `;

    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const flowchartData = JSON.parse(text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(flowchartData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error converting flowchart');
  }
});

app.post('/api/dry-run', async (req, res) => {
  try {
    const { flowchart, testInput } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Given the following structured flowchart (nodes and edges) and the test input provided by the student:

      Flowchart: ${JSON.stringify(flowchart)}
      Test Input: ${testInput}

      Simulate the execution of this flowchart step-by-step.
      For each step, provide:
      1. nodeId: The ID of the node being executed.
      2. variables: The current state of all variables (e.g., { i: 1, sum: 10 }).
      3. explanation: What is happening in this step.
      4. output: Any output generated at this step (if any).

      Also, provide:
      - expectedOutput: The final output expected from a correct execution.
      - actualOutput: The output produced by this specific flowchart (might be the same if correct).
      - mistakeExplanation: If there's a mistake in the flowchart logic compared to what might be expected, explain it.
      - accuracyScore: A score from 0 to 100 based on the correctness of the flowchart.

      Return ONLY a JSON object with "steps" (array of steps), "expectedOutput", "actualOutput", "mistakeExplanation", and "accuracyScore".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const dryRunData = JSON.parse(text);

    res.json(dryRunData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during dry run simulation');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
