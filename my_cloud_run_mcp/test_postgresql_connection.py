#!/usr/bin/env python3
"""
Test script to verify PostgreSQL connection after deployment
"""

import requests
import json
import time
import os

# Use local server URL in development, production URL in production
MCP_SERVER_URL = os.getenv('MCP_SERVER_URL', 'http://localhost:3000')

def test_sql_function(function_name, arguments=None):
    """Test a specific SQL function"""
    if arguments is None:
        arguments = {}
    
    try:
        response = requests.post(
            f'{MCP_SERVER_URL}/mcp',
            json={
                'jsonrpc': '2.0',
                'method': 'tools/call',
                'params': {
                    'name': function_name,
                    'arguments': arguments
                },
                'id': 1
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            },
            timeout=60
        )
        
        if response.status_code == 200:
            content = response.text
            if 'data:' in content:
                lines = content.split('\n')
                for line in lines:
                    if line.startswith('data:'):
                        data = json.loads(line[5:])
                        if 'result' in data:
                            result = data['result']
                            if 'content' in result and result['content']:
                                text_content = result['content'][0].get('text', '')
                                return True, text_content
                            else:
                                return True, result
                        elif 'error' in data:
                            return False, data['error']
                        break
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, f"Exception: {e}"
    
    return False, "No valid response received"

def main():
    """Run comprehensive PostgreSQL connection tests"""
    print("🔄 POSTGRESQL CONNECTION TESTS")
    print("=" * 50)
    print(f"Testing server: {MCP_SERVER_URL}")
    print("=" * 50)
    
    tests = [
        ('test_db_connection', {}, 'Basic database connection'),
        ('initialize_database', {}, 'Database table creation'),
        ('create_node', {'label': 'Test Symptom', 'type': 'Symptom'}, 'Create a test node'),
        ('list_nodes', {}, 'List all nodes'),
        ('create_node', {'label': 'Test Diagnosis', 'type': 'Diagnosis'}, 'Create another node'),
        ('list_nodes', {'type': 'Symptom'}, 'List nodes by type'),
    ]
    
    results = []
    
    for function_name, args, description in tests:
        print(f"\n🧪 Testing: {description}")
        print(f"   Function: {function_name}")
        print(f"   Arguments: {args}")
        
        success, result = test_sql_function(function_name, args)
        
        if success:
            print(f"   ✅ SUCCESS: {result}")
            results.append((function_name, True, result))
        else:
            print(f"   ❌ FAILED: {result}")
            results.append((function_name, False, result))
        
        # Small delay between tests
        time.sleep(1)
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! PostgreSQL connection is working!")
    else:
        print("⚠️  Some tests failed. Check the details above.")
        
    print("\nDetailed Results:")
    for function_name, success, result in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {function_name}")
        if not success:
            print(f"      Error: {result}")

if __name__ == "__main__":
    main() 