import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/get-recipe", async (req, res) => {
  const ingredients = req.body.ingredients || [];
  const ingredientsString = ingredients.join(", ");

  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: "You are an assistant that receives a list of ingredients and suggests a recipe...",
    messages: [
      { role: "user", content: `I have ${ingredientsString}. Please give me a recipe!` }
    ]
  });

  res.json({ recipe: msg.content[0].text });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
