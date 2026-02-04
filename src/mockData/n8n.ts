// N8N Workflow Integration - Mock Data
// This file contains sample workflows, execution logs, and test data

export interface N8NWorkflow {
    id: string;
    name: string;
    description: string;
    webhook_url: string;
    workflow_id: string;
    category: 'notification' | 'escalation' | 'ticketing' | 'data_logging' | 'conditional';
    nodes_count: number;
    is_active: boolean;
    created_at: string;
    last_execution?: string;
    execution_count: number;
    success_rate: number;
}

export interface N8NExecution {
    id: string;
    workflow_id: string;
    workflow_name: string;
    alert_id: number;
    sensor_name: string;
    area_name: string;
    status: 'success' | 'failed' | 'running';
    started_at: string;
    finished_at?: string;
    duration_ms?: number;
    error_message?: string;
    payload_sent: any;
    response_received?: any;
}

// Sample N8N Workflows
export const mockN8NWorkflows: N8NWorkflow[] = [
    {
        id: 'wf_001',
        name: 'Critical Alert → Email + SMS Escalation',
        description: 'Send email immediately, wait 5 minutes, then send SMS if alert still active',
        webhook_url: 'https://n8n.example.com/webhook/critical-escalation',
        workflow_id: 'critical_escalation',
        category: 'escalation',
        nodes_count: 6,
        is_active: true,
        created_at: '2026-01-15T10:30:00Z',
        last_execution: '2026-02-03T08:45:00Z',
        execution_count: 127,
        success_rate: 98.4
    },
    {
        id: 'wf_002',
        name: 'High CO2 → Slack + Jira Ticket',
        description: 'Post to #alerts channel and create high-priority Jira ticket',
        webhook_url: 'https://n8n.example.com/webhook/co2-jira',
        workflow_id: 'co2_jira_integration',
        category: 'ticketing',
        nodes_count: 4,
        is_active: true,
        created_at: '2026-01-20T14:00:00Z',
        last_execution: '2026-02-03T07:20:00Z',
        execution_count: 89,
        success_rate: 100
    },
    {
        id: 'wf_003',
        name: 'Sensor Offline → PagerDuty Incident',
        description: 'Create high-urgency PagerDuty incident when sensor goes offline',
        webhook_url: 'https://n8n.example.com/webhook/sensor-offline-pd',
        workflow_id: 'sensor_offline_pagerduty',
        category: 'notification',
        nodes_count: 3,
        is_active: true,
        created_at: '2026-01-25T09:15:00Z',
        last_execution: '2026-02-02T16:30:00Z',
        execution_count: 34,
        success_rate: 97.1
    },
    {
        id: 'wf_004',
        name: 'Multi-Channel Conditional Router',
        description: 'Route alerts to different channels based on area and severity',
        webhook_url: 'https://n8n.example.com/webhook/conditional-router',
        workflow_id: 'conditional_alert_router',
        category: 'conditional',
        nodes_count: 8,
        is_active: true,
        created_at: '2026-01-28T11:45:00Z',
        last_execution: '2026-02-03T09:10:00Z',
        execution_count: 156,
        success_rate: 99.4
    },
    {
        id: 'wf_005',
        name: 'Alert Data Logger → Google Sheets',
        description: 'Log all alert data to Google Sheets for analysis',
        webhook_url: 'https://n8n.example.com/webhook/sheets-logger',
        workflow_id: 'google_sheets_logger',
        category: 'data_logging',
        nodes_count: 2,
        is_active: true,
        created_at: '2026-02-01T13:20:00Z',
        last_execution: '2026-02-03T09:55:00Z',
        execution_count: 203,
        success_rate: 100
    },
    {
        id: 'wf_006',
        name: 'Temperature Alert → HVAC API',
        description: 'Automatically adjust HVAC settings when temperature exceeds thresholds',
        webhook_url: 'https://n8n.example.com/webhook/hvac-control',
        workflow_id: 'hvac_auto_control',
        category: 'conditional',
        nodes_count: 5,
        is_active: false,
        created_at: '2026-01-18T15:30:00Z',
        last_execution: '2026-01-30T12:00:00Z',
        execution_count: 45,
        success_rate: 95.6
    }
];

// Sample Execution Logs
export const mockN8NExecutions: N8NExecution[] = [
    {
        id: 'exec_001',
        workflow_id: 'wf_001',
        workflow_name: 'Critical Alert → Email + SMS Escalation',
        alert_id: 1234,
        sensor_name: 'Sensor-Floor3-Room202',
        area_name: 'Building A - Floor 3',
        status: 'success',
        started_at: '2026-02-03T09:45:00Z',
        finished_at: '2026-02-03T09:50:35Z',
        duration_ms: 335000,
        payload_sent: {
            alert: { id: 1234, type: 'high_co2', severity: 'critical' },
            sensor: { name: 'Sensor-Floor3-Room202' },
            area: { name: 'Building A - Floor 3' }
        },
        response_received: {
            email_sent: true,
            sms_sent: true,
            execution_id: 'n8n_exec_12345'
        }
    },
    {
        id: 'exec_002',
        workflow_id: 'wf_002',
        workflow_name: 'High CO2 → Slack + Jira Ticket',
        alert_id: 1235,
        sensor_name: 'Sensor-Floor2-Room105',
        area_name: 'Building B - Floor 2',
        status: 'success',
        started_at: '2026-02-03T08:30:00Z',
        finished_at: '2026-02-03T08:30:45Z',
        duration_ms: 45000,
        payload_sent: {
            alert: { id: 1235, type: 'high_co2', severity: 'warning' },
            sensor: { name: 'Sensor-Floor2-Room105' }
        },
        response_received: {
            slack_message_ts: '1675392000.123456',
            jira_ticket: 'OPS-789'
        }
    },
    {
        id: 'exec_003',
        workflow_id: 'wf_003',
        workflow_name: 'Sensor Offline → PagerDuty Incident',
        alert_id: 1236,
        sensor_name: 'Sensor-Floor1-Lobby',
        area_name: 'Main Building - Lobby',
        status: 'failed',
        started_at: '2026-02-03T07:15:00Z',
        finished_at: '2026-02-03T07:15:05Z',
        duration_ms: 5000,
        error_message: 'PagerDuty API returned 429: Rate limit exceeded',
        payload_sent: {
            alert: { id: 1236, type: 'sensor_offline', severity: 'critical' }
        }
    },
    {
        id: 'exec_004',
        workflow_id: 'wf_004',
        workflow_name: 'Multi-Channel Conditional Router',
        alert_id: 1237,
        sensor_name: 'Sensor-ServerRoom-A1',
        area_name: 'Data Center - Server Room A',
        status: 'success',
        started_at: '2026-02-03T06:00:00Z',
        finished_at: '2026-02-03T06:00:12Z',
        duration_ms: 12000,
        payload_sent: {
            alert: { id: 1237, type: 'high_temperature', severity: 'critical' },
            area: { name: 'Data Center - Server Room A' }
        },
        response_received: {
            route_taken: 'critical_datacenter',
            notifications: ['email_it_team', 'pagerduty', 'slack_ops']
        }
    },
    {
        id: 'exec_005',
        workflow_id: 'wf_005',
        workflow_name: 'Alert Data Logger → Google Sheets',
        alert_id: 1238,
        sensor_name: 'Sensor-Floor4-Conference',
        area_name: 'Building A - Floor 4',
        status: 'running',
        started_at: '2026-02-03T09:55:00Z',
        payload_sent: {
            alert: { id: 1238, type: 'high_humidity', severity: 'info' }
        }
    }
];

// Sample Workflow Scenarios
export const workflowScenarios = [
    {
        id: 'scenario_1',
        title: 'Email + SMS Escalation',
        description: 'Send email notification, wait for acknowledgment, escalate to SMS if needed',
        use_case: 'Critical alerts requiring immediate response',
        workflow_diagram: `
Webhook → Send Email → Wait 5min → Check Alert Status → If Active → Send SMS
        `,
        nodes: [
            { type: 'webhook', label: 'Webhook Trigger' },
            { type: 'email', label: 'Send Email' },
            { type: 'wait', label: 'Wait 5 Minutes' },
            { type: 'http', label: 'Check Alert Status' },
            { type: 'if', label: 'Is Still Active?' },
            { type: 'sms', label: 'Send SMS' }
        ],
        example_payload: {
            alert: { type: 'high_co2', severity: 'critical', status: 'active' },
            sensor: { name: 'Sensor-Floor3-Room202' }
        }
    },
    {
        id: 'scenario_2',
        title: 'Conditional Multi-Channel Routing',
        description: 'Route alerts to different channels based on area type and severity',
        use_case: 'Different response protocols for different facility areas',
        workflow_diagram: `
Webhook → Switch (by area) → 
  ├─ Server Room → PagerDuty
  ├─ Office → Email
  └─ Default → Slack
        `,
        nodes: [
            { type: 'webhook', label: 'Webhook Trigger' },
            { type: 'switch', label: 'Route by Area' },
            { type: 'pagerduty', label: 'Page IT Team' },
            { type: 'email', label: 'Email Facilities' },
            { type: 'slack', label: 'Slack Notification' }
        ]
    },
    {
        id: 'scenario_3',
        title: 'Slack + Jira Integration',
        description: 'Post to Slack and create Jira ticket for critical alerts',
        use_case: 'Tracking and managing alert resolution',
        workflow_diagram: `
Webhook → Slack Post → Create Jira Ticket → Link in Thread
        `,
        nodes: [
            { type: 'webhook', label: 'Webhook Trigger' },
            { type: 'slack', label: 'Post to #alerts' },
            { type: 'jira', label: 'Create Ticket' },
            { type: 'slack', label: 'Reply with Ticket Link' }
        ]
    }
];

// Frontend → Backend → N8N Data Flow
export const dataFlowExamples = {
    frontend_sends: {
        description: 'Data sent from HALO frontend when creating n8n action',
        example: {
            name: 'Critical_CO2_Workflow',
            type: 'n8n_workflow',
            n8n_workflow_url: 'https://n8n.example.com/webhook/critical-alerts',
            n8n_workflow_id: 'critical_co2_handler',
            n8n_api_key: 'sk_live_xxxxx',
            n8n_auth_header: 'X-API-Key',
            n8n_timeout: 30,
            is_active: true
        }
    },
    backend_stores: {
        description: 'How backend stores n8n action in database',
        database_fields: [
            { field: 'id', type: 'INTEGER PRIMARY KEY' },
            { field: 'name', type: 'VARCHAR(255)' },
            { field: 'type', type: 'VARCHAR(50)' },
            { field: 'n8n_workflow_url', type: 'VARCHAR(500)' },
            { field: 'n8n_workflow_id', type: 'VARCHAR(100)' },
            { field: 'n8n_api_key', type: 'VARCHAR(255) ENCRYPTED' },
            { field: 'n8n_auth_header', type: 'VARCHAR(50)' },
            { field: 'n8n_timeout', type: 'INTEGER DEFAULT 30' },
            { field: 'is_active', type: 'BOOLEAN' }
        ]
    },
    alert_triggers_workflow: {
        description: 'When alert is triggered, backend sends payload to n8n',
        webhook_request: {
            method: 'POST',
            url: 'https://n8n.example.com/webhook/critical-alerts',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'sk_live_xxxxx'
            },
            body: {
                payload_version: '1.0',
                timestamp: '2026-02-03T09:45:00Z',
                source: 'HALO Alert System',
                alert: {
                    id: 1234,
                    type: 'high_co2',
                    severity: 'critical',
                    status: 'active',
                    description: 'CO2 levels exceeded threshold'
                },
                sensor: {
                    id: 456,
                    name: 'Sensor-Floor3-Room202',
                    location: 'Building A, Floor 3'
                },
                area: {
                    id: 45,
                    name: 'Building A - Floor 3'
                }
            }
        }
    },
    n8n_responds: {
        description: 'N8N workflow execution response',
        example_response: {
            status: 200,
            data: {
                success: true,
                execution_id: 'n8n_exec_12345',
                workflow_id: 'critical_co2_handler',
                actions_performed: [
                    { action: 'email_sent', recipient: 'admin@example.com' },
                    { action: 'slack_posted', channel: '#critical-alerts' }
                ]
            }
        }
    }
};

// Sample API responses for testing
export const mockAPIResponses = {
    trigger_success: {
        success: true,
        message: 'Workflow triggered successfully',
        execution_id: 'exec_' + Date.now(),
        workflow_id: 'test_workflow',
        timestamp: new Date().toISOString()
    },
    trigger_error: {
        success: false,
        error: 'Webhook timeout after 30 seconds',
        workflow_id: 'test_workflow',
        timestamp: new Date().toISOString()
    },
    workflow_status: {
        execution_id: 'exec_12345',
        status: 'success',
        started_at: '2026-02-03T09:45:00Z',
        finished_at: '2026-02-03T09:45:12Z',
        duration_ms: 12000
    }
};
