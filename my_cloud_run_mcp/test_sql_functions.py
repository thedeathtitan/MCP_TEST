#!/usr/bin/env python3
"""
Test script for SQL database functions in the MCP server.
Tests database connectivity, node creation, deletion, and other operations.
"""

import json
import requests
import time
from typing import Dict, Any, List, Optional

class MCPSQLTester:
    """Tester for MCP server SQL database functionality."""
    
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.request_id = 1
        self.session = requests.Session()
        
        # Set required headers for MCP Streamable HTTP transport
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        })
    
    def _make_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a JSON-RPC request to the MCP server."""
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "id": self.request_id
        }
        
        if params:
            payload["params"] = params
            
        self.request_id += 1
        
        print(f"\n🔄 Calling {method}...")
        print(f"📤 Request: {json.dumps(payload, indent=2)}")
        
        try:
            response = self.session.post(self.server_url, json=payload, timeout=30)
            print(f"📊 Status Code: {response.status_code}")
            
            # Handle SSE response
            if response.headers.get('content-type', '').startswith('text/event-stream'):
                return self._parse_sse_response(response.text)
            else:
                result = response.json()
                print(f"📥 Response: {json.dumps(result, indent=2)}")
                return result
                
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def _parse_sse_response(self, sse_text: str) -> Dict[str, Any]:
        """Parse Server-Sent Events response."""
        lines = sse_text.strip().split('\n')
        for line in lines:
            if line.startswith('data: '):
                try:
                    result = json.loads(line[6:])  # Remove 'data: ' prefix
                    print(f"📥 Response: {json.dumps(result, indent=2)}")
                    return result
                except json.JSONDecodeError:
                    continue
        return {"error": "Could not parse SSE response"}
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a specific tool on the MCP server."""
        return self._make_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
    
    def initialize(self) -> Dict[str, Any]:
        """Initialize the MCP session."""
        return self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "roots": {
                    "listChanged": True
                },
                "sampling": {}
            },
            "clientInfo": {
                "name": "sql-test-client",
                "version": "1.0.0"
            }
        })

def test_sql_functionality():
    """Run comprehensive tests on the SQL database functionality."""
    
    server_url = "https://mcp-server-371380987858.us-central1.run.app/mcp"
    client = MCPSQLTester(server_url)
    
    print("🧪 Starting SQL Database Tests")
    print(f"🎯 Target Server: {server_url}")
    print("=" * 80)
    
    # Initialize MCP session
    print("\n📋 INITIALIZING MCP SESSION")
    init_response = client.initialize()
    if "error" in init_response:
        print("❌ Initialization failed!")
        return
    else:
        print("✅ Initialization successful!")
    
    # Test 1: Database Connection
    print("\n📋 TEST 1: Database Connection Test")
    conn_response = client.call_tool("test_db_connection", {})
    print(f"Result: {'✅ PASS' if 'successful' in str(conn_response) else '❌ FAIL'}")
    
    # Test 2: Initialize Database Tables
    print("\n📋 TEST 2: Initialize Database Tables")
    init_db_response = client.call_tool("initialize_database", {})
    print(f"Result: {'✅ PASS' if 'successful' in str(init_db_response) else '❌ FAIL'}")
    
    # Test 3: Create Nodes
    print("\n📋 TEST 3: Create Nodes")
    test_nodes = [
        {"label": "sore throat", "type": "Symptom"},
        {"label": "fever", "type": "Symptom"},
        {"label": "strep throat", "type": "Diagnosis"},
        {"label": "antibiotics", "type": "Treatment"},
        {"label": "throat culture", "type": "Test"}
    ]
    
    created_node_ids = []
    for node_data in test_nodes:
        print(f"\nCreating node: {node_data['label']} ({node_data['type']})")
        create_response = client.call_tool("create_node", node_data)
        
        if "error" not in create_response and "result" in create_response:
            # Try to extract node ID from the response text
            response_text = str(create_response.get("result", {}).get("content", [{}])[0].get("text", ""))
            if "ID:" in response_text:
                try:
                    node_id = int(response_text.split("ID:")[1].split("\n")[0].strip())
                    created_node_ids.append(node_id)
                    print(f"✅ Created node with ID: {node_id}")
                except:
                    print("⚠️ Node created but couldn't extract ID")
            else:
                print("⚠️ Node creation response unclear")
        else:
            print(f"❌ Failed to create node: {create_response}")
    
    # Test 4: List All Nodes
    print("\n📋 TEST 4: List All Nodes")
    list_response = client.call_tool("list_nodes", {})
    print(f"Result: {'✅ PASS' if 'Found' in str(list_response) or 'nodes' in str(list_response) else '❌ FAIL'}")
    
    # Test 5: List Nodes by Type
    print("\n📋 TEST 5: List Nodes by Type (Symptoms)")
    list_symptoms_response = client.call_tool("list_nodes", {"type": "Symptom"})
    print(f"Result: {'✅ PASS' if 'Found' in str(list_symptoms_response) or 'Symptom' in str(list_symptoms_response) else '❌ FAIL'}")
    
    # Test 6: Get Specific Node
    if created_node_ids:
        print(f"\n📋 TEST 6: Get Specific Node (ID: {created_node_ids[0]})")
        get_response = client.call_tool("get_node", {"nodeId": created_node_ids[0]})
        print(f"Result: {'✅ PASS' if 'Node Details' in str(get_response) else '❌ FAIL'}")
    
    # Test 7: Update Node
    if created_node_ids:
        print(f"\n📋 TEST 7: Update Node (ID: {created_node_ids[0]})")
        update_response = client.call_tool("update_node", {
            "nodeId": created_node_ids[0],
            "label": "severe sore throat",
            "type": "Symptom"
        })
        print(f"Result: {'✅ PASS' if 'updated successfully' in str(update_response) else '❌ FAIL'}")
    
    # Test 8: Delete Node
    if created_node_ids and len(created_node_ids) > 1:
        node_to_delete = created_node_ids[-1]  # Delete the last created node
        print(f"\n📋 TEST 8: Delete Node (ID: {node_to_delete})")
        delete_response = client.call_tool("delete_node", {"nodeId": node_to_delete})
        print(f"Result: {'✅ PASS' if 'deleted successfully' in str(delete_response) else '❌ FAIL'}")
        
        # Verify deletion
        print(f"\n📋 TEST 8b: Verify Node Deletion (ID: {node_to_delete})")
        get_deleted_response = client.call_tool("get_node", {"nodeId": node_to_delete})
        print(f"Result: {'✅ PASS' if 'not found' in str(get_deleted_response) else '❌ FAIL'}")
    
    # Test 9: Error Handling - Invalid Node ID
    print("\n📋 TEST 9: Error Handling - Get Non-existent Node")
    invalid_response = client.call_tool("get_node", {"nodeId": 99999})
    print(f"Result: {'✅ PASS' if 'not found' in str(invalid_response) else '❌ FAIL'}")
    
    # Test 10: Error Handling - Missing Required Fields
    print("\n📋 TEST 10: Error Handling - Create Node with Missing Fields")
    missing_field_response = client.call_tool("create_node", {"label": "incomplete node"})
    print(f"Result: {'✅ PASS' if 'error' in str(missing_field_response) else '❌ FAIL'}")
    
    print("\n" + "=" * 80)
    print("🎉 SQL Database Tests Completed!")
    print("\n📊 SUMMARY:")
    print("- Database connection test")
    print("- Table initialization")  
    print("- Node creation (multiple types)")
    print("- Node listing (all and filtered)")
    print("- Node retrieval")
    print("- Node updating")
    print("- Node deletion")
    print("- Error handling validation")
    print("\n💡 Check the output above for individual test results!")

if __name__ == "__main__":
    test_sql_functionality() 