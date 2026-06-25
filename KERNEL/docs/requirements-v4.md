
# Goal
add a chat capability to the personality results page - so that the User can interactively query a bit more (for whichever personality they land on)

## Details

Follow the INVARIANTS

- Show the user how many more queries they have as a count

The LLM call should include:
- the user's question/prompt

As context:
- the User's result personality
- The top 3 scores from the quiz (i.e. the result one plus the 2 nearest)
- Source links for the Result and 2 nearest Personalities

Responses should be concise - no need for preamble nor summary.

Answers should be at most 9 paragraphs or 300 sentences, whichever is least.

## Edge Cases

If the User does not have quiz scores, disable the chat capability.
Provide a warning: "Chat is only available for those completing the full quiz." 

