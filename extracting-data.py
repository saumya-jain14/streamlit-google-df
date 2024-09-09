import streamlit as st
import pandas as pd
import uuid
from google.cloud import dialogflowcx_v3beta1 as dialogflow
import requests
from llm_api import generate_qa_from_text
import json

url = 'http://localhost:3001/detect-intent'


# Main Streamlit app code
st.title("CSV File Uploader and Dialogflow Interaction")

uploaded_file = st.file_uploader(
    "Upload a CSV file with questions", type=['csv'])
if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)
    st.write("Uploaded Questions:")
    st.write(df)

    # Create a new DataFrame to store the preprocessed data
    new_rows = []

    # Iterate through each row in the DataFrame and preprocess the questions
    for index, row in df.iterrows():
        questions = row['question'].split('<br>')
        old_answer = row['answer']
        for q in questions:
            new_rows.append({'question': q, 'answer': old_answer})

    # Create a new DataFrame from the preprocessed data
    preprocessed_df = pd.DataFrame(new_rows)

    # Set up an empty DataFrame to store the results
    result_df = pd.DataFrame(columns=['Question', 'FAQ Answer'])

    # Iterate through each row in the preprocessed DataFrame
    for index, row in preprocessed_df.iterrows():
        question = row['question']
        old_answer = row['answer']

        # Generate a unique session ID for each question
        session_id = str(uuid.uuid4())

        # Hit the API for each question in a new session
        payload = {
            "query": question,
            "languageCode": "en",
            "projectId": "ccap-gptfy-qa",  # Project Changed to QA
            "location": "global",
            "agentId": "d4960a91-7d8b-4c34-8e75-63be50cd1114",  # Aditya dev
            "event_name": "test",
        }

        responses = requests.post(url, json=payload)
        if responses.status_code == 200:
            # Parse the JSON response
            response = responses.json()
            # print("API Response:", json.dumps(response, indent=4))
            botComparisson = generate_qa_from_text(old_answer, response["answers"])
            # Append the question and corresponding answer to the result DataFrame
            result_df = result_df._append(
                {'Question': question, 'FAQ Answer': old_answer, 'Bot Response': response["answers"], 'Not Enough Information': response["NOT_ENOUGH_INFORMATION"], 'SessionId': response["sessionId"], "Response Not Fetched From FAQ": response["RespNotFetteched"], "Keyword": response["keyword"], "Number of times till we get response": response["counter"], "ResponseAccuracy": botComparisson}, ignore_index=True)
            result_df.to_csv('dialogflow_results.csv', index=False)
        else:
            print(f"Error: Received status code {responses.status_code}")
            print("Response content:", responses.content)
            print(question)

        

    # Main Streamlit app code
    st.title("Display Dialogflow Results from CSV")

    # Load the CSV file containing the Dialogflow results
    # Specify the correct path to the CSV file
    csv_file_path = "dialogflow_results.csv"
    df = pd.read_csv(csv_file_path)

    # Display the contents of the CSV file
    if not df.empty:
        st.write("Dialogflow Results:")
        st.write(df)
    else:
        st.write("No data found in the CSV file.")
