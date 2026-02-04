import React, { useState } from 'react';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Card, { CardBody, CardHeader, CardTitle, CardActions } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Badge from '../../../components/bootstrap/Badge';
import Icon from '../../../components/icon/Icon';
import {
    mockN8NWorkflows,
    mockN8NExecutions,
    workflowScenarios,
    dataFlowExamples,
    mockAPIResponses,
    N8NWorkflow,
    N8NExecution
} from '../../../mockData/n8n';
import { buildN8NAlertPayload, triggerN8NWorkflow } from '../../../api/sensors.api';
import Spinner from '../../../components/bootstrap/Spinner';
import Alert from '../../../components/bootstrap/Alert';
import classNames from 'classnames';

const N8NIntegrationTutorial = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'executions' | 'tutorial' | 'test'>('overview');
    const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Test webhook trigger
    const handleTestWorkflow = async (workflow: N8NWorkflow) => {
        setIsTesting(true);
        setTestResult(null);

        // Simulate test payload
        const testPayload = {
            payload_version: '1.0',
            timestamp: new Date().toISOString(),
            source: 'HALO Alert System (Test)',
            alert: {
                id: 9999,
                type: 'test_alert',
                severity: 'info' as const,
                status: 'active' as any,
                description: 'This is a test alert',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            sensor: {
                id: 999,
                name: 'Test-Sensor-001',
                location: 'Test Location'
            },
            area: {
                id: 99,
                name: 'Test Area'
            },
            filter: {
                id: 9,
                name: 'Test Filter',
                trigger_condition: 'max_violation' as const
            },
            action: {
                id: 1,
                name: workflow.name,
                type: 'n8n_workflow',
                workflow_id: workflow.workflow_id
            }
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock response (50% success rate for demo)
        const isSuccess = Math.random() > 0.3;
        if (isSuccess) {
            setTestResult({
                ...mockAPIResponses.trigger_success,
                workflow_name: workflow.name,
                payload: testPayload
            });
        } else {
            setTestResult({
                ...mockAPIResponses.trigger_error,
                workflow_name: workflow.name
            });
        }

        setIsTesting(false);
    };

    const renderOverview = () => (
        <div className="row g-4">
            <div className="col-12">
                <Alert color="info" icon="Info">
                    <strong>N8N Workflow Integration</strong> allows you to trigger complex, multi-step automations
                    when alert filters match threshold violations. This page demonstrates how the integration works
                    with live examples and testing capabilities.
                </Alert>
            </div>

            {/* Stats Cards */}
            <div className="col-md-3">
                <Card className="shadow-sm">
                    <CardBody>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small">Active Workflows</div>
                                <div className="fs-3 fw-bold text-primary">
                                    {mockN8NWorkflows.filter(w => w.is_active).length}
                                </div>
                            </div>
                            <Icon icon="AccountTree" size="3x" className="text-primary-subtle" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="col-md-3">
                <Card className="shadow-sm">
                    <CardBody>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small">Total Executions</div>
                                <div className="fs-3 fw-bold text-success">
                                    {mockN8NWorkflows.reduce((sum, w) => sum + w.execution_count, 0)}
                                </div>
                            </div>
                            <Icon icon="PlayArrow" size="3x" className="text-success-subtle" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="col-md-3">
                <Card className="shadow-sm">
                    <CardBody>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small">Avg Success Rate</div>
                                <div className="fs-3 fw-bold text-info">
                                    {(mockN8NWorkflows.reduce((sum, w) => sum + w.success_rate, 0) / mockN8NWorkflows.length).toFixed(1)}%
                                </div>
                            </div>
                            <Icon icon="CheckCircle" size="3x" className="text-info-subtle" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="col-md-3">
                <Card className="shadow-sm">
                    <CardBody>
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small">Recent Failures</div>
                                <div className="fs-3 fw-bold text-danger">
                                    {mockN8NExecutions.filter(e => e.status === 'failed').length}
                                </div>
                            </div>
                            <Icon icon="Error" size="3x" className="text-danger-subtle" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* How It Works */}
            <div className="col-12">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon="Info" className="me-2" />
                            How N8N Integration Works
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="row g-4">
                            <div className="col-md-4">
                                <div className="text-center">
                                    <div className="bg-primary-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: '60px', height: '60px' }}>
                                        <Icon icon="FilterAlt" size="2x" className="text-primary" />
                                    </div>
                                    <h6 className="fw-bold">1. Alert Filter Triggers</h6>
                                    <p className="small text-muted">
                                        When sensor values exceed thresholds, alert filter activates and identifies
                                        associated n8n actions.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="text-center">
                                    <div className="bg-success-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: '60px', height: '60px' }}>
                                        <Icon icon="Send" size="2x" className="text-success" />
                                    </div>
                                    <h6 className="fw-bold">2. Webhook Payload Sent</h6>
                                    <p className="small text-muted">
                                        Backend constructs rich JSON payload with alert, sensor, area, and filter context,
                                        then POSTs to n8n webhook URL.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="text-center">
                                    <div className="bg-info-subtle rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: '60px', height: '60px' }}>
                                        <Icon icon="AutoAwesome" size="2x" className="text-info" />
                                    </div>
                                    <h6 className="fw-bold">3. N8N Workflow Executes</h6>
                                    <p className="small text-muted">
                                        N8N receives webhook, processes through workflow nodes (email, SMS, Slack, etc.),
                                        and returns execution results.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Workflow Scenarios */}
            <div className="col-12">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon="Category" className="me-2" />
                            Common Workflow Scenarios
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="row g-3">
                            {workflowScenarios.map((scenario) => (
                                <div key={scenario.id} className="col-md-4">
                                    <Card className="border h-100">
                                        <CardBody>
                                            <h6 className="fw-bold mb-2">{scenario.title}</h6>
                                            <p className="small text-muted mb-2">{scenario.description}</p>
                                            <div className="bg-light p-2 rounded small mb-2">
                                                <strong>Use Case:</strong> {scenario.use_case}
                                            </div>
                                            <div className="mt-3">
                                                <small className="text-muted">Nodes: {scenario.nodes.length}</small>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    const renderWorkflows = () => (
        <div className="row g-4">
            <div className="col-12">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon="AccountTree" className="me-2" />
                            Available N8N Workflows
                        </CardTitle>
                        <CardActions>
                            <Button color="primary" icon="Add" size="sm">
                                Create New Workflow
                            </Button>
                        </CardActions>
                    </CardHeader>
                    <CardBody>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Workflow Name</th>
                                        <th>Category</th>
                                        <th>Nodes</th>
                                        <th>Executions</th>
                                        <th>Success Rate</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockN8NWorkflows.map((workflow) => (
                                        <tr key={workflow.id}>
                                            <td>
                                                <div className="fw-bold">{workflow.name}</div>
                                                <small className="text-muted">{workflow.description}</small>
                                            </td>
                                            <td>
                                                <Badge color="info">{workflow.category.toUpperCase()}</Badge>
                                            </td>
                                            <td>{workflow.nodes_count}</td>
                                            <td>{workflow.execution_count.toLocaleString()}</td>
                                            <td>
                                                <span className={classNames('fw-bold', {
                                                    'text-success': workflow.success_rate >= 98,
                                                    'text-warning': workflow.success_rate >= 95 && workflow.success_rate < 98,
                                                    'text-danger': workflow.success_rate < 95
                                                })}>
                                                    {workflow.success_rate}%
                                                </span>
                                            </td>
                                            <td>
                                                <Badge color={workflow.is_active ? 'success' : 'light'}>
                                                    {workflow.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        color="info"
                                                        size="sm"
                                                        isLight
                                                        icon="Visibility"
                                                        onClick={() => setSelectedWorkflow(workflow)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        isLight
                                                        icon="PlayArrow"
                                                        onClick={() => handleTestWorkflow(workflow)}
                                                        isDisable={isTesting}
                                                    >
                                                        Test
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Selected Workflow Details */}
            {selectedWorkflow && (
                <div className="col-12">
                    <Card className="border-primary">
                        <CardHeader className="bg-primary text-white">
                            <CardTitle>Workflow Details</CardTitle>
                            <CardActions>
                                <Button
                                    color="light"
                                    size="sm"
                                    icon="Close"
                                    onClick={() => setSelectedWorkflow(null)}
                                />
                            </CardActions>
                        </CardHeader>
                        <CardBody>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <strong>Name:</strong> {selectedWorkflow.name}<br />
                                    <strong>Description:</strong> {selectedWorkflow.description}<br />
                                    <strong>Workflow ID:</strong> <code>{selectedWorkflow.workflow_id}</code>
                                </div>
                                <div className="col-md-6">
                                    <strong>Webhook URL:</strong><br />
                                    <code className="small">{selectedWorkflow.webhook_url}</code><br />
                                    <strong>Last Execution:</strong> {selectedWorkflow.last_execution || 'Never'}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );

    const renderExecutions = () => (
        <div className="row g-4">
            <div className="col-12">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon="History" className="me-2" />
                            Recent Workflow Executions
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Execution ID</th>
                                        <th>Workflow</th>
                                        <th>Alert / Sensor</th>
                                        <th>Started</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockN8NExecutions.map((execution) => (
                                        <tr key={execution.id}>
                                            <td><code className="small">{execution.id}</code></td>
                                            <td>
                                                <div className="small fw-bold">{execution.workflow_name}</div>
                                                <small className="text-muted">Alert #{execution.alert_id}</small>
                                            </td>
                                            <td>
                                                <div className="small">{execution.sensor_name}</div>
                                                <small className="text-muted">{execution.area_name}</small>
                                            </td>
                                            <td className="small">{new Date(execution.started_at).toLocaleString()}</td>
                                            <td>
                                                {execution.duration_ms
                                                    ? `${(execution.duration_ms / 1000).toFixed(1)}s`
                                                    : '-'}
                                            </td>
                                            <td>
                                                {execution.status === 'success' && (
                                                    <Badge color="success">SUCCESS</Badge>
                                                )}
                                                {execution.status === 'failed' && (
                                                    <Badge color="danger">FAILED</Badge>
                                                )}
                                                {execution.status === 'running' && (
                                                    <Badge color="warning">RUNNING</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    const renderTutorial = () => (
        <div className="row g-4">
            {/* Frontend → Backend → N8N Flow */}
            <div className="col-12">
                <Card>
                    <CardHeader className="bg-primary text-white">
                        <CardTitle>
                            <Icon icon="Schema" className="me-2" />
                            Frontend → Backend → N8N Data Flow
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="row g-4">
                            {/* Step 1: Frontend */}
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100">
                                    <h6 className="fw-bold text-primary mb-3">
                                        <Icon icon="Web" className="me-2" />
                                        1. Frontend Sends
                                    </h6>
                                    <p className="small mb-3">{dataFlowExamples.frontend_sends.description}</p>
                                    <div className="bg-light p-2 rounded">
                                        <pre className="mb-0 small" style={{ fontSize: '0.7rem' }}>
                                            {JSON.stringify(dataFlowExamples.frontend_sends.example, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Backend */}
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100">
                                    <h6 className="fw-bold text-success mb-3">
                                        <Icon icon="Storage" className="me-2" />
                                        2. Backend Stores
                                    </h6>
                                    <p className="small mb-3">{dataFlowExamples.backend_stores.description}</p>
                                    <div className="bg-light p-2 rounded">
                                        <strong className="small">Database Schema:</strong>
                                        <div className="mt-2 small" style={{ fontSize: '0.7rem' }}>
                                            {dataFlowExamples.backend_stores.database_fields.map((field, idx) => (
                                                <div key={idx} className="mb-1">
                                                    <code>{field.field}</code>: {field.type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: N8N */}
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100">
                                    <h6 className="fw-bold text-info mb-3">
                                        <Icon icon="Send" className="me-2" />
                                        3. Backend → N8N
                                    </h6>
                                    <p className="small mb-3">{dataFlowExamples.alert_triggers_workflow.description}</p>
                                    <div className="bg-light p-2 rounded">
                                        <pre className="mb-0 small" style={{ fontSize: '0.65rem' }}>
                                            {JSON.stringify(dataFlowExamples.alert_triggers_workflow.webhook_request, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* What Frontend Does */}
            <div className="col-md-6">
                <Card className="border-primary h-100">
                    <CardHeader className="bg-primary-subtle">
                        <CardTitle>
                            <Icon icon="Code" className="me-2" />
                            What Frontend Does
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <ol className="mb-0">
                            <li className="mb-2">
                                <strong>User creates n8n action</strong> via ActionForm.tsx
                                <ul className="small text-muted">
                                    <li>Enters webhook URL, workflow ID, timeout</li>
                                    <li>Optionally configures API key authentication</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>Form validates inputs</strong>
                                <ul className="small text-muted">
                                    <li>Webhook URL is required (HTML5 URL validation)</li>
                                    <li>Timeout must be 5-120 seconds</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>POST to backend API</strong>
                                <ul className="small text-muted">
                                    <li>Endpoint: <code>POST /api/actions/</code></li>
                                    <li>Sends all n8n configuration fields</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>Displays in table</strong>
                                <ul className="small text-muted">
                                    <li>Shows workflow ID with icon</li>
                                    <li>Can edit/delete like other actions</li>
                                </ul>
                            </li>
                        </ol>
                    </CardBody>
                </Card>
            </div>

            {/* What Backend Does */}
            <div className="col-md-6">
                <Card className="border-success h-100">
                    <CardHeader className="bg-success-subtle">
                        <CardTitle>
                            <Icon icon="DeveloperMode" className="me-2" />
                            What Backend Developer Provides
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <ol className="mb-0">
                            <li className="mb-2">
                                <strong>Database migration</strong>
                                <ul className="small text-muted">
                                    <li>Add columns: n8n_workflow_url, n8n_workflow_id, etc.</li>
                                    <li>Encrypt n8n_api_key field</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>API endpoints accept n8n fields</strong>
                                <ul className="small text-muted">
                                    <li><code>POST /api/actions/</code> - Create action</li>
                                    <li><code>PATCH /api/actions/&#123;id&#125;/</code> - Update action</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>Alert trigger logic</strong>
                                <ul className="small text-muted">
                                    <li>When alert fires, check if actions include n8n type</li>
                                    <li>Build payload with buildN8NAlertPayload()</li>
                                    <li>Call triggerN8NWorkflow() helper</li>
                                </ul>
                            </li>
                            <li className="mb-2">
                                <strong>Response handling</strong>
                                <ul className="small text-muted">
                                    <li>Log execution results to console/database</li>
                                    <li>Handle errors gracefully (timeouts, auth failures)</li>
                                </ul>
                            </li>
                        </ol>
                    </CardBody>
                </Card>
            </div>

            {/* Example Integration Code */}
            <div className="col-12">
                <Card>
                    <CardHeader className="bg-dark text-white">
                        <CardTitle>
                            <Icon icon="Code" className="me-2" />
                            Backend Integration Example (Python/Django)
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <pre className="bg-dark text-light p-3 rounded small mb-0">
                            {`# When alert is triggered in alert_manager.py
def trigger_alert_actions(alert, sensor, area, filter_obj):
    actions = filter_obj.actions.filter(type='n8n_workflow', is_active=True)
    
    for action in actions:
        # Build payload
        payload = {
            "payload_version": "1.0",
            "timestamp": datetime.now().isoformat(),
            "source": "HALO Alert System",
            "alert": {
                "id": alert.id,
                "type": alert.type,
                "severity": alert.severity,
                "status": alert.status,
                "description": alert.description
            },
            "sensor": {
                "id": sensor.id,
                "name": sensor.name,
                "location": sensor.location
            },
            "area": {
                "id": area.id,
                "name": area.name
            },
            "filter": {
                "id": filter_obj.id,
                "name": filter_obj.name
            },
            "action": {
                "id": action.id,
                "workflow_id": action.n8n_workflow_id
            }
        }
        
        # Make webhook request
        headers = {"Content-Type": "application/json"}
        if action.n8n_api_key:
            header_name = action.n8n_auth_header or "X-API-Key"
            headers[header_name] = action.n8n_api_key
        
        try:
            response = requests.post(
                action.n8n_workflow_url,
                json=payload,
                headers=headers,
                timeout=action.n8n_timeout or 30
            )
            logger.info(f"N8N workflow triggered: {action.workflow_id}, Status: {response.status_code}")
        except Exception as e:
            logger.error(f"N8N workflow failed: {action.workflow_id}, Error: {str(e)}")`}
                        </pre>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    const renderTest = () => (
        <div className="row g-4">
            <div className="col-12">
                <Alert color="warning" icon="Science">
                    <strong>Interactive Testing Environment</strong> - Test your n8n workflows with sample payloads.
                    Use webhook.site to inspect actual webhook requests.
                </Alert>
            </div>

            {isTesting && (
                <div className="col-12">
                    <Card className="border-primary">
                        <CardBody className="text-center py-5">
                            <Spinner size="3rem" color="primary" />
                            <div className="mt-3">Triggering workflow...</div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {testResult && (
                <div className="col-12">
                    <Card className={classNames('border', {
                        'border-success': testResult.success,
                        'border-danger': !testResult.success
                    })}>
                        <CardHeader className={classNames({
                            'bg-success-subtle': testResult.success,
                            'bg-danger-subtle': !testResult.success
                        })}>
                            <CardTitle>
                                {testResult.success ? (
                                    <>
                                        <Icon icon="CheckCircle" className="me-2 text-success" />
                                        Workflow Triggered Successfully
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="Error" className="me-2 text-danger" />
                                        Workflow Failed
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <strong>Workflow:</strong> {testResult.workflow_name}<br />
                                    <strong>Execution ID:</strong> <code>{testResult.execution_id}</code><br />
                                    <strong>Timestamp:</strong> {testResult.timestamp}
                                </div>
                                {testResult.error && (
                                    <div className="col-12">
                                        <Alert color="danger" className="mb-0">
                                            <strong>Error:</strong> {testResult.error}
                                        </Alert>
                                    </div>
                                )}
                                <div className="col-12">
                                    <details>
                                        <summary className="fw-bold mb-2" style={{ cursor: 'pointer' }}>
                                            View Payload Sent
                                        </summary>
                                        <pre className="bg-light p-3 rounded small mb-0">
                                            {JSON.stringify(testResult.payload, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Quick Test Section */}
            <div className="col-12">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Icon icon="PlayArrow" className="me-2" />
                            Quick Workflow Tests
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <div className="row g-3">
                            {mockN8NWorkflows.filter(w => w.is_active).map((workflow) => (
                                <div key={workflow.id} className="col-md-6">
                                    <Card className="border">
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="fw-bold mb-1">{workflow.name}</h6>
                                                    <small className="text-muted">{workflow.description}</small>
                                                </div>
                                                <Badge color="info">{workflow.category}</Badge>
                                            </div>
                                            <div className="mt-3">
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    icon="PlayArrow"
                                                    onClick={() => handleTestWorkflow(workflow)}
                                                    isDisable={isTesting}
                                                    className="w-100"
                                                >
                                                    {isTesting ? 'Testing...' : 'Test This Workflow'}
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Setup Instructions */}
            <div className="col-12">
                <Card className="border-info">
                    <CardHeader className="bg-info-subtle">
                        <CardTitle>
                            <Icon icon="Build" className="me-2" />
                            Testing with webhook.site
                        </CardTitle>
                    </CardHeader>
                    <CardBody>
                        <ol className="mb-0">
                            <li className="mb-2">
                                Go to <a href="https://webhook.site" target="_blank" rel="noopener noreferrer">webhook.site</a>
                            </li>
                            <li className="mb-2">
                                Copy your unique webhook URL
                            </li>
                            <li className="mb-2">
                                Go to <strong>HALO → Alerts → Actions</strong>
                            </li>
                            <li className="mb-2">
                                Create a new action with type "N8N Workflow"
                            </li>
                            <li className="mb-2">
                                Paste the webhook.site URL as the workflow webhook URL
                            </li>
                            <li className="mb-2">
                                Save and trigger an alert that uses this action
                            </li>
                            <li className="mb-0">
                                Go back to webhook.site to see the payload received
                            </li>
                        </ol>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    return (
        <PageWrapper title="N8N Integration Tutorial">
            <Page container="fluid">
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h1 className="display-6 fw-bold mb-2">
                                    <Icon icon="AccountTree" size="2x" className="me-3 text-primary" />
                                    N8N Workflow Integration
                                </h1>
                                <p className="text-muted mb-0">
                                    Live examples, testing tools, and comprehensive documentation
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="btn-group w-100" role="group">
                            <Button
                                color={activeTab === 'overview' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('overview')}
                                icon="Dashboard"
                            >
                                Overview
                            </Button>
                            <Button
                                color={activeTab === 'workflows' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('workflows')}
                                icon="AccountTree"
                            >
                                Workflows
                            </Button>
                            <Button
                                color={activeTab === 'executions' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('executions')}
                                icon="History"
                            >
                                Executions
                            </Button>
                            <Button
                                color={activeTab === 'tutorial' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('tutorial')}
                                icon="School"
                            >
                                Tutorial
                            </Button>
                            <Button
                                color={activeTab === 'test' ? 'primary' : 'light'}
                                onClick={() => setActiveTab('test')}
                                icon="Science"
                            >
                                Test
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'workflows' && renderWorkflows()}
                {activeTab === 'executions' && renderExecutions()}
                {activeTab === 'tutorial' && renderTutorial()}
                {activeTab === 'test' && renderTest()}
            </Page>
        </PageWrapper>
    );
};

export default N8NIntegrationTutorial;
