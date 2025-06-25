import google.generativeai as genai
import os
import asyncio
import httpx
import json
import uuid
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# --- CONFIGURATION ---
# IMPORTANT: Set your API Key as an environment variable for security
# In your terminal: export GEMINI_API_KEY="YOUR_API_KEY"
genai.configure(api_key="AIzaSyAueWo0rFVNjiv3LwDX4xP2vNU7qu52PdA")

# Paste the URL of your deployed MCP server here
MCP_SERVER_URL = "https://mcp-server-371380987858.us-central1.run.app" # e.g., "https://mcp-server-xyz.a.run.app"
# --- END CONFIGURATION ---

async def execute_tool_call(server_url: str, tool_name: str, tool_args: dict):
    """
    Executes a function call against the remote MCP server by sending a
    'tools/execute' JSON-RPC request.
    """
    mcp_endpoint = f"{server_url}/mcp"
    request_id = str(uuid.uuid4())
    
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/execute",
        "params": {
            "tool_code": tool_name,
            "args": tool_args
        },
        "id": request_id
    }

    print(f"\n--- Sending request to MCP Server ---")
    print(f"Endpoint: {mcp_endpoint}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-------------------------------------\n")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                mcp_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            response.raise_for_status()  # Raise an exception for bad status codes
            return response.json()
        except httpx.RequestError as e:
            print(f"An error occurred while requesting {e.request.url!r}.")
            print(f"Error: {e}")
            return None
        except httpx.HTTPStatusError as e:
            print(f"Error response {e.response.status_code} while requesting {e.request.url!r}.")
            print(f"Response body: {e.response.text}")
            return None

async def run_test():
    """
    Connects to the MCP server, initializes a Gemini model with the server as a tool,
    and sends a prompt to test the create_node function.
    """
    print(f"Connecting to MCP Server at: {MCP_SERVER_URL}")

    # The official Gemini API does not support remote MCP servers directly yet.
    # We are simulating a local client connecting to a remote endpoint.
    # This is a conceptual test. For a real-world scenario, you would
    # typically run an MCP server locally or use a library that abstracts
    # the remote connection.

    try:
        # Since we cannot directly connect to a remote HTTP endpoint with the `mcp` library's
        # stdio_client, we will proceed by defining the tool manually for the model.
        # This demonstrates the function calling aspect, assuming the connection works.

        create_node_declaration = {
            "name": "create_node",
            "description": "Creates a new node in the medical knowledge graph, such as a symptom, diagnosis, or test result.",
            "parameters": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "The text on the node"
                    },
                    "type": {
                        "type": "string",
                        "description": "e.g., 'Symptom', 'Diagnosis'"
                    },
                },
                "required": ["label", "type"],
            },
        }

        # Create the model and tell it about your tool
        mcp_tool = genai.types.Tool(function_declarations=[create_node_declaration])
        model = genai.GenerativeModel(model_name='gemini-1.5-flash', tools=[mcp_tool])
        chat = model.start_chat()

        print("Gemini model initialized. Sending prompt...")

        # The prompt that will cause Gemini to use your tool
        prompt = "A patient presents with a sore throat. Please create a node for this."

        response = chat.send_message(prompt)

        # Print the function call the model wants to make
        # The way to access the function call has changed in the google-generativeai library.
        # See: https://ai.google.dev/gemini-api/docs/function-calling
        try:
            part = response.candidates[0].content.parts[0]
            if part.function_call:
                fn_call = part.function_call
                print("\n--- Gemini wants to call a function ---")
                print(f"Function: {fn_call.name}")
                print(f"Arguments: {dict(fn_call.args)}")
                print("--------------------------------------\n")

                # <<< EXECUTE THE FUNCTION CALL ON THE SERVER >>>
                mcp_response = await execute_tool_call(
                    server_url=MCP_SERVER_URL,
                    tool_name=fn_call.name,
                    tool_args=dict(fn_call.args)
                )

                if mcp_response:
                    print("\n--- Received response from MCP Server ---")
                    print(json.dumps(mcp_response, indent=2))
                    print("-----------------------------------------\n")

            else:
                print("\n--- Gemini's Response (No function call) ---")
                print(response.text)
                print("---------------------------------------------\n")
        except (IndexError, AttributeError):
            print("\n--- Gemini's Response (No function call found in the expected structure) ---")
            print(response.text)
            print("---------------------------------------------------------------------------\n")

        print("Test finished. Check the output above to see the server's response.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # To run the async function
    asyncio.run(run_test())