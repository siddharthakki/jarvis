# JARVIS Autonomous Loop

JARVIS operates on a bounded ReAct-style self-correction loop to ensure high reliability and accuracy.

## The Execution Cycle

1.  **Plan**: The AI Planner analyzes the user request and current context (including history and relevant knowledge) to generate a set of actions.
2.  **Act**: JARVIS executes the planned tools (after security checks and potential user approval).
3.  **Observe**: Results from tool executions are captured as "observations".
4.  **Repair (Optional)**: If a tool fails or provides incomplete information, JARVIS analyzes the observations, performs a root cause analysis, and adjusts its plan for the next iteration.
5.  **Synthesize**: Once the goal is reached or max iterations (5) are hit, JARVIS synthesizes all observations into a polite, professional, and human-centric response.

## Key Features

- **Memory Integration**: Every plan iteration receives relevant snippets from the long-term vector knowledge base.
- **Post-Tool Synthesis**: JARVIS never gives "blind" responses. It always waits for tool results before speaking the final answer.
- **Error Recovery**: If a file isn't found or a command fails, JARVIS will automatically try alternative paths or search strategies before reporting failure.
- **Infinite Loop Protection**: The loop is strictly capped to prevent "hallucination spirals".
