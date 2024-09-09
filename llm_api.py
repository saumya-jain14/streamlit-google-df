import os
import openai
from dotenv import load_dotenv

load_dotenv()

# Ensure your OpenAI API key is set correctly from the environment or directly
openai.api_key = os.getenv("OPENAI_API_KEY") # Ensure you have your API key set in the environment

# Define a function to generate Q&A using OpenAI's ChatCompletion
def generate_qa_from_text(ActualResponse, BotResponse):
    """Generate Q&A format using OpenAI."""
    
    # Call the OpenAI API using the GPT-4 model (or any model you choose)
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an assistant who compares user and bot responses to check if they match."},
                {"role": "user", "content": f"""Compare the Actual Response and Bot Response, and check if the Bot Response is a part, variation, subset, alteration or modification of Actual Response.
               Provide the result only in Boolean format.
                
                Example:
                Actual Response: "Hello"
                Bot Response: "Hi"
                Output: True

                Actual Response: {ActualResponse}
                BotResponse: {BotResponse}
                Output: """}
            ]
        )
        # Return the first completion choice
        return completion.choices[0].message['content']
    
    except Exception as e:
        # Handle any errors from the OpenAI API call
        print(f"Error occurred: {str(e)}")
        return None