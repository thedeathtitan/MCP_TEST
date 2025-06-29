#!/usr/bin/env python3
"""
Test Gemini integration with SQL database functions.
This extends the existing Gemini test to include database operations.
"""

import google.generativeai as genai
import os
import asyncio
import httpx
import json
import uuid

# IMPORTANT: Set your API Key as an environment variable for security
genai.configure(api_key="AIzaSyAueWo0rFVNjiv3LwDX4xP2vNU7qu52PdA")

# Your deployed MCP server URL
MCP_SERVER_URL = "https://mcp-server-371380987858.us-central1.run.app"

async def execute_tool_call(server_url: str, tool_name: str, tool_args: dict):
    """
    Executes a function call against the remote MCP server.
    """
    mcp_endpoint = f"{server_url}/mcp"
    request_id = str(uuid.uuid4())
    
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": tool_args
        },
        "id": request_id
    }

    print(f"\n--- Sending request to MCP Server ---")
    print(f"Endpoint: {mcp_endpoint}")
    print(f"Tool: {tool_name}")
    print(f"Arguments: {json.dumps(tool_args, indent=2)}")
    print("-------------------------------------\n")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                mcp_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            print(f"Request error: {e}")
            return None
        except httpx.HTTPStatusError as e:
            print(f"HTTP error {e.response.status_code}: {e.response.text}")
            return None

async def run_gemini_sql_tests():
    """
    Tests Gemini's ability to work with SQL database functions.
    """
    print(f"🧪 Testing Gemini + SQL Database Integration")
    print(f"🎯 MCP Server: {MCP_SERVER_URL}")
    print("=" * 60)

    # Define all our database tools for Gemini
    database_tools = [
        {
            "name": "test_db_connection",
            "description": "Tests the connection to the Cloud SQL database",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "initialize_database",
            "description": "Initializes the database tables (nodes and relationships)",
            "parameters": {
                "type": "object", 
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "create_node",
            "description": "Creates a new node in the medical knowledge graph",
            "parameters": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "The text/label for the node (e.g., 'sore throat', 'strep throat')"
                    },
                    "type": {
                        "type": "string",
                        "description": "The type of the node (e.g., 'Symptom', 'Diagnosis', 'Treatment', 'Test')"
                    },
                },
                "required": ["label", "type"],
            },
        },
        {
            "name": "list_nodes",
            "description": "Lists all nodes, optionally filtered by type",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "description": "Optional filter by node type (e.g., 'Symptom', 'Diagnosis')"
                    },
                    "limit": {
                        "type": "number",
                        "description": "Maximum number of nodes to return (default: 20)"
                    }
                },
                "required": [],
            },
        },
        {
            "name": "get_node",
            "description": "Retrieves a specific node by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "nodeId": {
                        "type": "number",
                        "description": "The ID of the node to retrieve"
                    }
                },
                "required": ["nodeId"],
            },
        },
        {
            "name": "delete_node", 
            "description": "Deletes a node from the database by its ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "nodeId": {
                        "type": "number",
                        "description": "The ID of the node to delete"
                    }
                },
                "required": ["nodeId"],
            },
        }
    ]

    # Create the model with all database tools
    tool_declarations = [genai.types.Tool(function_declarations=[tool]) for tool in database_tools]
    model = genai.GenerativeModel(model_name='gemini-2.5-pro', tools=tool_declarations)

    # Test scenarios
    test_scenarios = [
        {
            "name": "Database Connection Test",
            "prompt": "Please test the database connection to make sure everything is working."
        },
        {
            "name": "Medical Case - Sore Throat",
            "prompt": "A patient presents with a sore throat and fever. Please create appropriate nodes for these symptoms in the medical knowledge graph."
        },
        {
            "name": "List All Symptoms",
            "prompt": "Please show me all the symptom nodes that are currently in the database."
        },
        {
            "name": "Complex Medical Scenario",
            "prompt": "A patient has been diagnosed with strep throat based on a positive throat culture. The treatment plan includes antibiotics. Please create nodes for the diagnosis, test, and treatment, then show me all the nodes we've created."
        }
    ]

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n🧪 TEST {i}: {scenario['name']}")
        print(f"📝 Prompt: {scenario['prompt']}")
        print("-" * 60)

        try:
            chat = model.start_chat()
            response = chat.send_message(scenario['prompt'])

            # Process function calls
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fn_call = part.function_call
                        print(f"🔧 Gemini wants to call: {fn_call.name}")
                        print(f"📋 Arguments: {dict(fn_call.args)}")

                        # Execute the function call
                        mcp_response = await execute_tool_call(
                            server_url=MCP_SERVER_URL,
                            tool_name=fn_call.name,
                            tool_args=dict(fn_call.args)
                        )

                        if mcp_response:
                            print(f"✅ MCP Response: {json.dumps(mcp_response, indent=2)}")

                            # Send the tool response back to Gemini
                            tool_response = genai.types.FunctionResponse(
                                name=fn_call.name,
                                response=mcp_response
                            )
                            
                            # Continue the conversation with the tool result
                            follow_up = chat.send_message(tool_response)
                            print(f"🤖 Gemini's final response: {follow_up.text}")
                        else:
                            print("❌ Failed to get response from MCP server")
                    else:
                        print(f"🤖 Gemini's response: {response.text}")

        except Exception as e:
            print(f"❌ Error in test {i}: {e}")

        print("\n" + "=" * 60)

    print("\n🎉 All Gemini + SQL tests completed!")

if __name__ == "__main__":
    asyncio.run(run_gemini_sql_tests()) 