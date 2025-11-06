// src/components/WorkflowEditor.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function WorkflowEditor() {
    const { workflowId } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const isEditing = workflowId && workflowId !== 'new'; // Mode check

    // Workflow details state
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [workflowSteps, setWorkflowSteps] = useState([]);
    const [newWorkflowId, setNewWorkflowId] = useState(''); // Only used when creating

    // Step form state (for adding AND editing)
    const [editingStepId, setEditingStepId] = useState(null); // Track which step is being edited
    const [stepOrder, setStepOrder] = useState(1);
    const [stepName, setStepName] = useState('');
    const [stepType, setStepType] = useState('MANUAL');
    const [stepConfig, setStepConfig] = useState('{}'); // Config as JSON string for textarea

    // Loading/Error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stepError, setStepError] = useState(null); // Step form specific errors

    // --- Fetch Workflow Data ---
    useEffect(() => {
        if (isEditing) {
            const fetchWorkflowData = async () => {
                setLoading(true); setError(null); setNewWorkflowId('');
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:3001/api/admin/workflows/${workflowId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error((await response.json()).error || 'Could not fetch workflow details.');
                    const data = await response.json();
                    setWorkflowName(data.name || '');
                    setWorkflowDescription(data.description || '');
                    // Sort steps fetched from API
                    setWorkflowSteps((data.steps || []).sort((a, b) => a.step_order - b.step_order));
                    setStepOrder((data.steps?.length || 0) + 1); // Set order for next potential add
                } catch (err) { setError(err.message); }
                finally { setLoading(false); }
            };
            fetchWorkflowData();
        } else {
            // Reset fields for 'new' workflow
            setWorkflowName(''); setWorkflowDescription(''); setWorkflowSteps([]);
            setStepOrder(1); setNewWorkflowId(''); setError(null); setStepError(null);
            setEditingStepId(null); // Ensure not in edit mode
        }
    }, [workflowId, isEditing]); // Refetch if ID changes or mode changes

    // --- Reset Step Form ---
    const resetStepForm = (nextOrder) => {
        setEditingStepId(null); // Exit edit mode
        setStepOrder(nextOrder || workflowSteps.length + 1); // Use provided order or calculate next
        setStepName('');
        setStepType('MANUAL');
        setStepConfig('{}');
        setStepError(null);
    };

    // --- Start Editing a Step ---
    const handleEditStep = (step) => {
        setEditingStepId(step.step_id);
        setStepOrder(step.step_order);
        setStepName(step.step_name);
        setStepType(step.task_type);
        // Prettify configuration JSON for editing in textarea
        setStepConfig(JSON.stringify(step.configuration || {}, null, 2));
        setStepError(null);
        // Scroll to the form for better UX
        const formElement = document.getElementById('step-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // --- Handle Add/Update Step Form Submission ---
    const handleStepSubmit = async (e) => {
        e.preventDefault();
        setStepError(null);
        let parsedConfig;
        try { // Validate JSON configuration from textarea
            parsedConfig = JSON.parse(stepConfig);
        } catch (jsonError) {
            setStepError('Configuration must be valid JSON.'); return;
        }

        const token = localStorage.getItem('token');
        // Determine URL and Method based on whether we are editing an existing step
        const url = editingStepId
            ? `http://localhost:3001/api/admin/workflows/${workflowId}/steps/${editingStepId}` // PUT URL
            : `http://localhost:3001/api/admin/workflows/${workflowId}/steps`; // POST URL
        const method = editingStepId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    step_order: parseInt(stepOrder, 10),
                    step_name: stepName,
                    task_type: stepType,
                    configuration: parsedConfig // Send the JS object
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Failed to ${editingStepId ? 'update' : 'add'} step.`);

            // --- Update UI State ---
            if (editingStepId) { // Update existing step in state
                setWorkflowSteps(prev => prev.map(s =>
                    s.step_id === editingStepId
                        ? { ...s, step_order: parseInt(stepOrder, 10), step_name: stepName, task_type: stepType, configuration: parsedConfig }
                        : s
                ).sort((a, b) => a.step_order - b.step_order)); // Re-sort after potential order change
            } else { // Add new step to state
                setWorkflowSteps(prev => [...prev, {
                    step_id: data.step_id, // Get new ID from response
                    workflow_id: workflowId,
                    step_order: parseInt(stepOrder, 10),
                    step_name: stepName,
                    task_type: stepType,
                    configuration: parsedConfig // Store the object
                }].sort((a, b) => a.step_order - b.step_order)); // Add and sort
            }
            // Reset form for the next potential addition, using the correct next order
            resetStepForm(workflowSteps.length + (editingStepId ? 1 : 2));

        } catch (err) { setStepError(err.message); }
    };

    // --- Handle Deleting a Step ---
    const handleDeleteStep = async (stepIdToDelete, stepOrderToDelete) => {
        if (!window.confirm(`Are you sure you want to delete step ${stepOrderToDelete}?`)) return;

        setStepError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/admin/workflows/${workflowId}/steps/${stepIdToDelete}`, {
                 method: 'DELETE',
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete step.');

            // Remove step from UI
            setWorkflowSteps(prev => prev.filter(s => s.step_id !== stepIdToDelete));
            // If the deleted step was being edited, reset the form
            if (editingStepId === stepIdToDelete) {
                 resetStepForm();
            }
            // Reset next step order based on the new list length
            setStepOrder(workflowSteps.length); // length is already reduced by 1 here effectively

        } catch (err) {
            setStepError(err.message); // Show error near step form
        }
    };

    // --- Handle Saving Workflow Details ---
    const handleSaveWorkflow = async () => {
        setError(null); setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let response; let url; let method; let payload;

            if (isEditing) { // Update existing workflow
                url = `http://localhost:3001/api/admin/workflows/${workflowId}`; method = 'PUT';
                payload = { name: workflowName, description: workflowDescription };
            } else { // Create new workflow
                if (!newWorkflowId.trim()) throw new Error('Workflow ID is required.');
                url = 'http://localhost:3001/api/admin/workflows'; method = 'POST';
                payload = { workflow_id: newWorkflowId.trim(), name: workflowName, description: workflowDescription };
            }

            response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} workflow.`);

            alert(`Workflow ${isEditing ? 'updated' : 'created'} successfully!`);
            if (!isEditing) navigate('/admin/workflows'); // Navigate back only on create

        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    // --- Render Logic ---
    if (loading && isEditing) return <div>Loading workflow details...</div>;
     // Show general error if not loading and no specific step error exists
    if (error && !stepError && !loading) return <div className="error">{error}</div>;

    return (
        <div className="workflow-editor-container card-container">
            <h2>{isEditing ? `Edit Workflow: ${workflowId}` : 'Create New Workflow'}</h2>
            {error && <div className="error">{error}</div>} {/* General Error Display */}

            {/* --- Workflow Details Form --- */}
            {!isEditing && (
                <div className="form-group"> <label>Workflow ID</label> <input type="text" value={newWorkflowId} onChange={(e) => setNewWorkflowId(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="Unique ID (e.g., CLAIM_HIGH_VALUE)" required /> </div>
            )}
            <div className="form-group"> <label>Workflow Name</label> <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder="e.g., Standard Claim Process" required /> </div>
            <div className="form-group"> <label>Description (Optional)</label> <input type="text" value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} /> </div>

            {/* --- Display Existing Steps --- */}
            <h3>Workflow Steps</h3>
            {workflowSteps.length === 0 ? ( <p>No steps defined yet.</p> ) : (
                <ol className="workflow-steps-list">
                    {workflowSteps.map(step => (
                        <li key={step.step_id || step.step_order}>
                            <div> {/* Flex container for title and buttons */}
                                <strong>{step.step_order}. {step.step_name}</strong> ({step.task_type})
                                <div> {/* Container for buttons */}
                                    <button onClick={() => handleEditStep(step)} className="action-button edit-button" disabled={loading}>Edit</button>
                                    <button onClick={() => handleDeleteStep(step.step_id, step.step_order)} className="action-button decline-button" disabled={loading}>Delete</button>
                                </div>
                            </div>
                            <pre>{JSON.stringify(step.configuration || {}, null, 2)}</pre> {/* Display configuration */}
                        </li>
                    ))}
                </ol>
            )}

            {/* --- Add / Edit Step Form (Only show when editing an existing workflow) --- */}
            {isEditing && (
                // Added id for scrolling
                <form id="step-form" onSubmit={handleStepSubmit} className="add-step-form">
                    <h4>{editingStepId ? `Edit Step ${stepOrder}` : 'Add New Step'}</h4>
                    {stepError && <div className="error">{stepError}</div>} {/* Step Form Error Display */}
                    <div className="form-group inline-group"> <label>Order:</label> <input type="number" value={stepOrder} onChange={(e) => setStepOrder(e.target.value)} required min="1" /> </div>
                    <div className="form-group inline-group"> <label>Name:</label> <input type="text" value={stepName} onChange={(e) => setStepName(e.target.value)} placeholder="e.g., Assign Adjuster" required /> </div>
                    <div className="form-group inline-group"> <label>Type:</label> <select value={stepType} onChange={(e) => setStepType(e.target.value)}> <option value="MANUAL">Manual Task</option> <option value="API">API Call</option> <option value="RULE">Rule Execution</option> </select> </div>
                    <div className="form-group"> <label>Configuration (JSON):</label> <textarea value={stepConfig} onChange={(e) => setStepConfig(e.target.value)} rows="4" placeholder='e.g., {"ruleName": "assignByAmount", "threshold": 5000}' /> </div>
                    <button type="submit" className="button-primary" style={{width: 'auto'}} disabled={loading}>{editingStepId ? 'Update Step' : '+ Add Step'}</button>
                    {editingStepId && ( // Show Cancel Edit button only when editing a step
                        <button type="button" onClick={() => resetStepForm()} className="button-secondary" style={{width: 'auto', marginLeft: '10px'}} disabled={loading}>Cancel Edit</button>
                    )}
                </form>
            )}

            {/* --- Save Workflow Button --- */}
            <hr style={{margin: '30px 0'}}/>
            <button onClick={handleSaveWorkflow} className="button-primary" style={{width: 'auto'}} disabled={loading}> {loading ? 'Saving...' : (isEditing ? 'Save Workflow Changes' : 'Create Workflow')} </button>
            <button onClick={() => navigate('/admin/workflows')} className="button-secondary" style={{width: 'auto', marginLeft: '10px'}} disabled={loading}> Cancel </button>
        </div>
    );
}

export default WorkflowEditor;