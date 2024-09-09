const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const fs = require('fs');

const app = express();
const port = 3000;

// const projectId = 'ccap-gptfy-qa';
// const location = 'global';
// const agentId = '7ed2a889-bd9e-4cdc-adc5-e79f9c158528';
const client = new SessionsClient();

// Middleware to parse JSON bodies
app.use(express.json());

// API route
app.post('/detect-intent', async (req, res) => {
  try {
    const query = req.body.query;
    const languageCode = req.body.languageCode;
    const projectId = req.body.projectId;
    const location = req.body.location;
    const agentId = req.body.agentId;
    const event = req.body.event_name;
    let bot_response, RespNotFetteched, nText=true, keyword, counter=0, sessionId, sessionPath, request, request1;
    let response, BotRespMessages, resp, resp2, textResponse, results, i, j;

    while (nText && counter<5) {
        nText=false
        console.log(query)
        sessionId = Math.random().toString(36).substring(7);
        sessionPath = client.projectLocationAgentSessionPath(
            projectId,
            location,
            agentId,
            sessionId
        );

        request = {
            session: sessionPath,
            queryInput: {
            event: {
                event: event,
            },
            languageCode,
            },
        };
    
        await client.detectIntent(request);

        request1 = {
            session: sessionPath,
            queryInput: {
            text: {
                text: query,
            },
            languageCode,
            },
        };
        [response] = await client.detectIntent(request1);
        // fs.writeFile("output.txt", response.queryResult, (err) => {
        //     if (err) {
        //         console.error('Error writing to file', err);
        //     } else {
        //         console.log('Data successfully written to file!');
        //     }
        // });
        BotRespMessages = response?.queryResult?.responseMessages;
        if (response?.queryResult?.dataStoreConnectionSignals?.answerGenerationModelCallSignals?.model == "NOT_ENOUGH_INFORMATION") {
            results = "true";
            RespNotFetteched = "true";
            nText = true;
        } else {
            resp = response.queryResult?.diagnosticInfo?.fields["DataStore Execution Sequence"]?.structValue?.fields?.steps?.listValue?.values;
            results = "";
            if (resp) {
                for (i = 0; i < resp.length; i++) {
                    resp2 = resp[i]?.structValue?.fields?.responses?.listValue?.values;
                    if (resp2) {
                        for (j = 0; j < resp2.length; j++) {
                            textResponse = resp2[j]?.structValue?.fields?.text?.stringValue == "NOT_ENOUGH_INFORMATION";
                            if (textResponse) {
                                results = "true";
                                RespNotFetteched = "true";
                                nText = true;
                            }
                        }
                    }
                }
            }
        }
        if (results.length == 0) {
            results = "false";
            RespNotFetteched = "false"
        }
    
        if (BotRespMessages[0]?.message === "text") {
            bot_response = BotRespMessages[0]?.text?.text[0];
            if (bot_response === "I’m sorry, I could not find an answer to that." || 
                bot_response === "I’m sorry, I could not find an answer to that. " ||
                bot_response === "I’m sorry, I don't have an answer to that. I'm still learning! If you would like to speak to a Cultural Care staff member, just type \"staff\" and you will be connected to a member of our team."
            ) {
                results = "true";
                RespNotFetteched = "true";
                nText = true;
            }
            counter++
            
        } else if (BotRespMessages[0]?.message === "payload") {
            if (BotRespMessages[0]?.payload?.fields?.keyword?.stringValue) {
                keyword = BotRespMessages[0]?.payload?.fields?.keyword?.stringValue
                nText = true;
            } else {
                keyword = "Some Keyword is getting triggered"
                nText = true;
            }
            if (BotRespMessages[1]?.message === "text") {
                bot_response = BotRespMessages[1]?.text?.text[0];
                nText = false
                RespNotFetteched = "false"
            } else {
                RespNotFetteched = "true"
            }
            
            if (bot_response === "I’m sorry, I could not find an answer to that." || 
                bot_response === "I’m sorry, I don't have an answer to that. I'm still learning! If you would like to speak to a Cultural Care staff member, just type \"staff\" and you will be connected to a member of our team."
            ) {
                results = "true";
                RespNotFetteched = "true";
                nText = true;
            }
            counter++
        } else {
            bot_response = "I’m sorry, I don't have an answer to that. I'm still learning! If you would like to speak to a Cultural Care staff member, just type \"staff\" and you will be connected to a member of our team."
            results = "true"
            RespNotFetteched = "true"
            nText = true
            counter++;
        }

        if (bot_response === "I’m sorry, I could not find an answer to that.") {
            results = "true";
            RespNotFetteched = "true";
            nText = true;
        }
    }
    

    // Send the results as JSON response
    res.json({
      success: true, 
      "NOT_ENOUGH_INFORMATION": results || "false", 
      "answers": bot_response || "null", 
      "sessionId": sessionId, 
      "RespNotFetteched": RespNotFetteched || "false",
      "keyword": keyword || null,
      "counter": counter
    });

  } catch (error) {
    console.error('Error during detect intent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
