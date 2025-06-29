#!/usr/bin/env python3
"""
Gemini MCP Client for Medical Diagnostic Assistant

This script demonstrates how to:
1. Connect to Google Gemini API
2. Process clinical text with AI
3. Extract medical concepts 
4. Create nodes in the medical knowledge graph via MCP
5. Generate diagnostic insights
"""

import os
import json
import requests
import google.generativeai as genai
from typing import Dict, List, Any, Optional
import time

class GeminiMCPClient:
    def __init__(self, mcp_server_url: str, gemini_api_key: str):
        """Initialize the Gemini MCP Client"""
        self.mcp_server_url = mcp_server_url
        self.gemini_api_key = gemini_api_key
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-pro')
        
        print(f"🤖 Gemini MCP Client initialized")
        print(f"📡 MCP Server: {mcp_server_url}")
        
    def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool and return the result"""
        try:
            response = requests.post(
                f"{self.mcp_server_url}/mcp",
                json={
                    'jsonrpc': '2.0',
                    'method': 'tools/call',
                    'params': {
                        'name': tool_name,
                        'arguments': arguments
                    },
                    'id': 1
                },
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Parse SSE response
                content = response.text
                if 'data:' in content:
                    for line in content.split('\n'):
                        if line.startswith('data:'):
                            data = json.loads(line[5:])
                            if 'result' in data:
                                result = data['result']
                                if 'content' in result and result['content']:
                                    return {
                                        'success': True,
                                        'data': result['content'][0].get('text', result)
                                    }
                                else:
                                    return {'success': True, 'data': result}
                            elif 'error' in data:
                                return {'success': False, 'error': data['error']}
            
            return {'success': False, 'error': f'HTTP {response.status_code}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def extract_medical_concepts(self, clinical_text: str) -> Dict[str, List[str]]:
        """Use Gemini to extract medical concepts from clinical text"""
        
        prompt = f"""
        Analyze the following clinical text and extract medical concepts in JSON format.
        
        Clinical Text: "{clinical_text}"
        
        Extract and categorize the following:
        1. Symptoms (patient complaints, observable signs)
        2. Diagnoses (medical conditions, diseases)
        3. Treatments (medications, procedures, therapies)
        4. Anatomical_Parts (body parts, organs, systems)
        5. Risk_Factors (lifestyle, genetic, environmental factors)
        
        Return ONLY a JSON object in this exact format:
        {{
            "symptoms": ["symptom1", "symptom2"],
            "diagnoses": ["diagnosis1", "diagnosis2"], 
            "treatments": ["treatment1", "treatment2"],
            "anatomical_parts": ["part1", "part2"],
            "risk_factors": ["factor1", "factor2"]
        }}
        
        Rules:
        - Use proper medical terminology
        - Be specific and accurate
        - Only include concepts explicitly mentioned or strongly implied
        - Return empty arrays if no concepts found in a category
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Find JSON in response (handle markdown code blocks)
            if '```json' in response_text:
                start = response_text.find('```json') + 7
                end = response_text.find('```', start)
                json_text = response_text[start:end].strip()
            elif '```' in response_text:
                start = response_text.find('```') + 3
                end = response_text.find('```', start)
                json_text = response_text[start:end].strip()
            elif response_text.startswith('{'):
                json_text = response_text
            else:
                # Try to find JSON object in text
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                json_text = response_text[start:end] if start != -1 else response_text
            
            concepts = json.loads(json_text)
            
            print(f"🧠 Extracted concepts: {len(sum(concepts.values(), []))} total items")
            return concepts
            
        except Exception as e:
            print(f"❌ Error extracting concepts: {e}")
            return {
                "symptoms": [],
                "diagnoses": [],
                "treatments": [],
                "anatomical_parts": [],
                "risk_factors": []
            }
    
    def create_knowledge_graph_nodes(self, concepts: Dict[str, List[str]]) -> Dict[str, List[Dict]]:
        """Create nodes in the knowledge graph for extracted concepts"""
        
        results = {
            "created_nodes": [],
            "errors": []
        }
        
        # Map concept categories to node types
        concept_type_mapping = {
            "symptoms": "Symptom",
            "diagnoses": "Diagnosis", 
            "treatments": "Treatment",
            "anatomical_parts": "Anatomical_Part",
            "risk_factors": "Risk_Factor"
        }
        
        for category, concept_list in concepts.items():
            node_type = concept_type_mapping.get(category, category.title())
            
            for concept in concept_list:
                if concept.strip():  # Skip empty concepts
                    print(f"📝 Creating node: '{concept}' ({node_type})")
                    
                    result = self.call_mcp_tool('create_node', {
                        'label': concept.strip(),
                        'type': node_type
                    })
                    
                    if result['success']:
                        results['created_nodes'].append({
                            'label': concept,
                            'type': node_type,
                            'data': result['data']
                        })
                        print(f"   ✅ Created successfully")
                    else:
                        results['errors'].append({
                            'label': concept,
                            'type': node_type,
                            'error': result['error']
                        })
                        print(f"   ❌ Failed: {result['error']}")
                    
                    # Small delay to avoid overwhelming the server
                    time.sleep(0.5)
        
        return results
    
    def generate_diagnostic_insights(self, clinical_text: str, created_nodes: List[Dict]) -> str:
        """Generate diagnostic insights based on the clinical text and created nodes"""
        
        nodes_summary = "\n".join([
            f"- {node['label']} ({node['type']})" 
            for node in created_nodes
        ])
        
        prompt = f"""
        Based on the following clinical text and extracted medical concepts, provide diagnostic insights:
        
        Clinical Text: "{clinical_text}"
        
        Extracted Concepts:
        {nodes_summary}
        
        Please provide:
        1. **Clinical Summary**: Brief overview of the case
        2. **Potential Diagnoses**: Most likely conditions based on symptoms
        3. **Recommended Tests**: Diagnostic tests that should be considered
        4. **Red Flags**: Any concerning symptoms that need immediate attention
        5. **Next Steps**: Recommended follow-up actions
        
        Format as a clear, professional medical assessment.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating insights: {e}"
    
    def process_clinical_case(self, clinical_text: str) -> Dict[str, Any]:
        """Complete workflow: process clinical text and create knowledge graph"""
        
        print(f"\n🏥 Processing Clinical Case")
        print(f"📄 Text: {clinical_text[:100]}..." if len(clinical_text) > 100 else f"📄 Text: {clinical_text}")
        print("="*60)
        
        # Step 1: Extract medical concepts
        print("\n1️⃣ Extracting medical concepts with Gemini...")
        concepts = self.extract_medical_concepts(clinical_text)
        
        for category, items in concepts.items():
            if items:
                print(f"   {category.title()}: {', '.join(items)}")
        
        # Step 2: Create knowledge graph nodes
        print(f"\n2️⃣ Creating knowledge graph nodes...")
        node_results = self.create_knowledge_graph_nodes(concepts)
        
        print(f"   ✅ Created: {len(node_results['created_nodes'])} nodes")
        if node_results['errors']:
            print(f"   ❌ Errors: {len(node_results['errors'])} nodes failed")
        
        # Step 3: Generate diagnostic insights
        print(f"\n3️⃣ Generating diagnostic insights...")
        insights = self.generate_diagnostic_insights(clinical_text, node_results['created_nodes'])
        
        # Step 4: Query updated knowledge graph
        print(f"\n4️⃣ Querying knowledge graph...")
        graph_result = self.call_mcp_tool('list_nodes', {'limit': 20})
        
        total_nodes = 0
        if graph_result['success']:
            # Count nodes in the response
            response_text = graph_result['data']
            if 'Found' in str(response_text):
                try:
                    # Extract number from "Found X nodes" message
                    import re
                    match = re.search(r'Found (\d+) nodes', str(response_text))
                    if match:
                        total_nodes = int(match.group(1))
                except:
                    total_nodes = len(node_results['created_nodes'])
        
        print(f"   📊 Total nodes in knowledge graph: {total_nodes}")
        
        return {
            'clinical_text': clinical_text,
            'extracted_concepts': concepts,
            'created_nodes': node_results['created_nodes'],
            'errors': node_results['errors'],
            'diagnostic_insights': insights,
            'total_graph_nodes': total_nodes
        }

def main():
    """Demo of Gemini MCP integration"""
    
    # Configuration
    MCP_SERVER_URL = "https://mcp-server-371380987858.us-central1.run.app"
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    if not GEMINI_API_KEY:
        print("❌ Please set GEMINI_API_KEY environment variable")
        print("   Get your API key from: https://aistudio.google.com/app/apikey")
        return
    
    # Initialize client
    client = GeminiMCPClient(MCP_SERVER_URL, GEMINI_API_KEY)
    
    # Sample clinical cases
    clinical_cases = [
        {
            "title": "Chest Pain Case",
            "text": "45-year-old male presents with acute chest pain radiating to left arm, associated with shortness of breath and diaphoresis. Pain started 2 hours ago while climbing stairs. Patient has history of hypertension and smoking. Vital signs show elevated heart rate and blood pressure."
        },
        {
            "title": "Respiratory Case", 
            "text": "32-year-old female with 5-day history of productive cough with yellow sputum, fever up to 101.5°F, and pleuritic chest pain. Physical exam reveals decreased breath sounds and dullness to percussion in right lower lobe."
        },
        {
            "title": "Neurological Case",
            "text": "68-year-old male with sudden onset of right-sided weakness, slurred speech, and facial drooping noticed by family this morning. Symptoms developed over 30 minutes. Patient has diabetes and atrial fibrillation, not on anticoagulation."
        }
    ]
    
    # Process each case
    for i, case in enumerate(clinical_cases, 1):
        print(f"\n{'='*80}")
        print(f"🏥 CLINICAL CASE {i}: {case['title']}")
        print(f"{'='*80}")
        
        result = client.process_clinical_case(case['text'])
        
        print(f"\n📋 DIAGNOSTIC INSIGHTS:")
        print("-" * 40)
        print(result['diagnostic_insights'])
        
        if i < len(clinical_cases):
            print(f"\n⏸️  Waiting 3 seconds before next case...")
            time.sleep(3)
    
    print(f"\n🎉 All cases processed! Check your knowledge graph at:")
    print(f"   {MCP_SERVER_URL}")

if __name__ == "__main__":
    main() 