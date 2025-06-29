-- =============================================
-- Initial Database Schema for MCP Diagnostics System
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Core Tables
-- =============================================

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    contact_info JSONB,
    medical_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical conditions/diagnoses
CREATE TABLE medical_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL, -- ICD-10 or similar codes
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    severity_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code)
);

-- Symptoms
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    severity_scale VARCHAR(50) DEFAULT '1-10',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code)
);

-- Diagnostic relationships (knowledge graph)
CREATE TABLE diagnostic_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL, -- 'symptom', 'condition', 'test'
    source_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    relationship_type VARCHAR(100) NOT NULL, -- 'causes', 'indicates', 'rules_out', etc.
    confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    evidence_level VARCHAR(50) DEFAULT 'low', -- 'low', 'medium', 'high', 'definitive'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient cases/encounters
CREATE TABLE patient_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    case_number VARCHAR(255) UNIQUE NOT NULL,
    chief_complaint TEXT,
    presenting_symptoms JSONB,
    assessment JSONB,
    differential_diagnoses JSONB,
    final_diagnoses JSONB,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'referred'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagnostic sessions (AI-assisted reasoning)
CREATE TABLE diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES patient_cases(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL, -- Store reasoning steps, probabilities
    ai_model_version VARCHAR(100),
    session_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Patients
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Medical conditions
CREATE INDEX idx_medical_conditions_code ON medical_conditions(code);
CREATE INDEX idx_medical_conditions_category ON medical_conditions(category);
CREATE INDEX idx_medical_conditions_name ON medical_conditions USING gin(to_tsvector('english', name));

-- Symptoms
CREATE INDEX idx_symptoms_code ON symptoms(code);
CREATE INDEX idx_symptoms_category ON symptoms(category);
CREATE INDEX idx_symptoms_name ON symptoms USING gin(to_tsvector('english', name));

-- Diagnostic relationships
CREATE INDEX idx_diagnostic_relationships_source ON diagnostic_relationships(source_type, source_id);
CREATE INDEX idx_diagnostic_relationships_target ON diagnostic_relationships(target_type, target_id);
CREATE INDEX idx_diagnostic_relationships_type ON diagnostic_relationships(relationship_type);
CREATE INDEX idx_diagnostic_relationships_confidence ON diagnostic_relationships(confidence_score);

-- Patient cases
CREATE INDEX idx_patient_cases_patient_id ON patient_cases(patient_id);
CREATE INDEX idx_patient_cases_status ON patient_cases(status);
CREATE INDEX idx_patient_cases_created_at ON patient_cases(created_at);

-- Diagnostic sessions
CREATE INDEX idx_diagnostic_sessions_case_id ON diagnostic_sessions(case_id);
CREATE INDEX idx_diagnostic_sessions_status ON diagnostic_sessions(session_status);

-- =============================================
-- Sample Data (for development)
-- =============================================

-- Insert sample medical conditions
INSERT INTO medical_conditions (code, name, description, category, severity_level) VALUES
('J00', 'Acute nasopharyngitis [common cold]', 'Common cold caused by viral infection', 'Respiratory', 1),
('J06.9', 'Acute upper respiratory infection, unspecified', 'Upper respiratory tract infection', 'Respiratory', 2),
('K59.00', 'Constipation, unspecified', 'Difficulty in bowel movements', 'Gastrointestinal', 1),
('R06.02', 'Shortness of breath', 'Difficulty breathing or breathlessness', 'Respiratory', 3),
('R50.9', 'Fever, unspecified', 'Elevated body temperature', 'General', 2);

-- Insert sample symptoms
INSERT INTO symptoms (code, name, description, category) VALUES
('SYMP001', 'Runny nose', 'Nasal discharge', 'Respiratory'),
('SYMP002', 'Cough', 'Persistent coughing', 'Respiratory'),
('SYMP003', 'Fever', 'Elevated body temperature', 'General'),
('SYMP004', 'Headache', 'Pain in head region', 'Neurological'),
('SYMP005', 'Fatigue', 'Feeling of tiredness or exhaustion', 'General');

-- Insert sample diagnostic relationships
INSERT INTO diagnostic_relationships (source_type, source_id, target_type, target_id, relationship_type, confidence_score, evidence_level) 
SELECT 
    'symptom', s.id, 'condition', c.id, 'indicates', 0.8, 'high'
FROM symptoms s, medical_conditions c 
WHERE s.name = 'Runny nose' AND c.code = 'J00';

INSERT INTO diagnostic_relationships (source_type, source_id, target_type, target_id, relationship_type, confidence_score, evidence_level) 
SELECT 
    'symptom', s.id, 'condition', c.id, 'indicates', 0.7, 'medium'
FROM symptoms s, medical_conditions c 
WHERE s.name = 'Cough' AND c.code = 'J06.9';

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_conditions_updated_at BEFORE UPDATE ON medical_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_symptoms_updated_at BEFORE UPDATE ON symptoms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostic_relationships_updated_at BEFORE UPDATE ON diagnostic_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_cases_updated_at BEFORE UPDATE ON patient_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostic_sessions_updated_at BEFORE UPDATE ON diagnostic_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 