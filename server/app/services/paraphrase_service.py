import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def paraphrase_text(text: str):

    prompt = f"""
Rewrite the following academic text in professional English.

Rules:
- Preserve original meaning
- Improve grammar
- Improve clarity
- Keep technical terms unchanged
- Return only rewritten text

Text:
{text}
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.5
    )

    return completion.choices[0].message.content