// --- 1. Import Required Tools ---
require('dotenv').config(); // <-- ADDED: Loads .env file
const express = require('express');
const mysql = require('mysql2/promise'); // Using the 'promise' version for modern async/await
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard for bcrypt
const jwt = require('jsonwebtoken');

const multer = require('multer'); // --- NEW (IWAS-F-013)
const fs = require('fs');         // --- NEW (IWAS-F-013)

// v-- MODIFIED: Read secret from .env, with a fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_12345';


// --- 2. Setup the Express App ---
const app = express();
const port = 3001; // We'll run the backend on port 3001
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Allow the server to read JSON from requests


// --- 3. Database Connection Configuration ---
// --- 3. Database Connection Configuration ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};
// --- AUDIT LOG HELPER FUNCTION (IWAS-F-042) ---
const logAuditEvent = async (userId, userType, actionType, entityId = null, details = null) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO audit_log (user_id, user_type, action_type, entity_id, details)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, userType, actionType, entityId, details ? JSON.stringify(details) : null]
        );
        console.log(`[AUDIT] User ${userId} (${userType}) performed ${actionType}` + (entityId ? ` on ${entityId}` : ''));
    } catch (error) {
        console.error('CRITICAL: Failed to write audit log entry:', error);
    } finally {
        if (connection) await connection.end();
    }
};


// --- 4. Middleware ---
// ... (Your existing checkAuth and checkAdmin middleware - no changes) ...
// Middleware for checking the JWT token
const checkAuth = (req, res, next) => {
    try {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            throw new Error('No token provided');
        }
        const token = req.headers.authorization.split(' ')[1]; // Extract token after "Bearer "
        const decodedToken = jwt.verify(token, JWT_SECRET);
        req.user = decodedToken; // Add decoded user info (like customer_id, admin_id, isAdmin) to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Auth Error:", error.message);
        // Differentiate between token missing/malformed and token expired/invalid signature
        if (error.name === 'JsonWebTokenError' || error.name === 'SyntaxError' || error.message === 'No token provided') {
             res.status(401).json({ error: 'Authentication failed: Invalid token format.' });
        } else if (error.name === 'TokenExpiredError') {
             res.status(401).json({ error: 'Authentication failed: Token expired.' });
        }
        else {
            res.status(401).json({ error: 'Authentication failed!' });
        }
    }
};

// Middleware to check if the authenticated user is an Admin
const checkAdmin = (req, res, next) => {
    // Assumes checkAuth has already run and added req.user
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' }); // Send 403 Forbidden
    }
    next(); // User is an admin, proceed
};


// --- 5. Workflow Engine Logic ---
// ... (Your existing executeWorkflowStep logic - no changes) ...
async function executeWorkflowStep(claimId) {
    let connection;
    console.log(`[WF Engine] Processing claim: ${claimId}`); // Added prefix for clarity
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction(); // Use transactions for safety

        // 1. Get current claim state (Lock the row for update)
        const [claimRows] = await connection.execute(
            'SELECT * FROM claim WHERE claim_id = ? FOR UPDATE', // Lock row
            [claimId]
        );
        if (claimRows.length === 0) {
            console.error(`[WF Engine] Claim ${claimId} not found during execution.`);
            await connection.rollback();
            return;
        }
        const claim = claimRows[0];
        const currentWorkflowId = claim.workflow_id;
        const currentStepOrder = claim.current_step_order;

        if (!currentWorkflowId || currentStepOrder == null) {
            console.log(`[WF Engine] Claim ${claimId} workflow already complete or not assigned.`);
            await connection.rollback(); // No changes needed
            return; // Workflow complete or not assigned
        }

        // 2. Get the definition for the current step
        const [stepRows] = await connection.execute(
            'SELECT * FROM workflow_steps WHERE workflow_id = ? AND step_order = ?',
            [currentWorkflowId, currentStepOrder]
        );

        if (stepRows.length === 0) {
            console.log(`[WF Engine] Workflow ${currentWorkflowId} completed for claim ${claimId}. No step found at order ${currentStepOrder}.`);
            await connection.execute('UPDATE claim SET current_step_order = NULL WHERE claim_id = ?', [claimId]);
            await connection.commit(); // Commit completion
            return; // End of workflow
        }
        const currentStep = stepRows[0];
        // Ensure configuration is parsed safely if it's stored as a string
        let stepConfig = {};
        try {
            stepConfig = (typeof currentStep.configuration === 'string')
                           ? JSON.parse(currentStep.configuration || '{}')
                           : (currentStep.configuration || {});
        } catch(e){
            console.error(`[WF Engine] Failed to parse configuration JSON for step ${currentStep.step_id}: ${currentStep.configuration}`);
            throw new Error("Invalid step configuration JSON"); // Throw error to halt workflow
        }


        console.log(`[WF Engine] Current Step (${currentStep.step_order} - ${currentStep.step_name}): ${currentStep.task_type}`);

        // 3. Execute step based on type
        let stepCompleted = false;
        let skipNextStepLogic = false; // Flag for conditional skips
        let nextStepOrder = null; // Default to null (complete) unless next step found

        // Find the *next* defined step in the workflow to jump to (do this early)
        const [nextStepRows] = await connection.execute(
             'SELECT MIN(step_order) as next_order FROM workflow_steps WHERE workflow_id = ? AND step_order > ?',
             [currentWorkflowId, currentStepOrder]
        );
        if (nextStepRows.length > 0 && nextStepRows[0].next_order != null) {
            nextStepOrder = nextStepRows[0].next_order;
        } else {
             console.log(`[WF Engine] No steps found after step ${currentStepOrder} for workflow ${currentWorkflowId}.`);
        }


        switch (currentStep.task_type) {
            case 'RULE':
                console.log(`[WF Engine] Executing RULE: ${stepConfig.ruleName || 'Unnamed'}`);
                // --- Rule Logic ---
                if (stepConfig.ruleName === 'assignByAmount') {
                    if (parseFloat(claim.amount) < stepConfig.threshold) {
                        if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in assignByAmount rule config.");
                        await connection.execute('UPDATE claim SET admin_id = ? WHERE claim_id = ?', [stepConfig.targetAdminId, claimId]);
                        console.log(`[WF Engine] Assigned claim ${claimId} to admin ${stepConfig.targetAdminId}`);
                    } else {
                        console.log(`[WF Engine] Claim ${claimId} amount (${claim.amount}) >= threshold (${stepConfig.threshold}). Skipping assignment.`);
                        // Optional: Assign to different admin/group if needed
                    }
                } else if (stepConfig.ruleName === 'autoApproveSimple') {
                    await connection.execute( `UPDATE claim SET claim_status = 'APPROVED', status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?`, ['\nClaim auto-approved by workflow rule.', claimId]);
                    console.log(`[WF Engine] Claim ${claimId} auto-approved by rule.`);
                } else if (stepConfig.ruleName === 'checkStatus') {
                    if (!stepConfig.expectedStatus) throw new Error("Missing expectedStatus in checkStatus rule config.");
                    console.log(`[WF Engine] Checking if claim status is ${stepConfig.expectedStatus}. Current: ${claim.claim_status}`);
                    if (claim.claim_status !== stepConfig.expectedStatus) {
                        console.log(`[WF Engine] Status check failed. Halting branch.`);
                        skipNextStepLogic = true; // Don't proceed further down this path
                        nextStepOrder = null; // Mark workflow as complete/halted for this branch
                    } else {
                        console.log(`[WF Engine] Status check passed.`);
                    }
                } else if (stepConfig.ruleName === 'reassignClaim') {
                     if (!stepConfig.targetAdminId) throw new Error("Missing targetAdminId in reassignClaim rule config.");
                     await connection.execute("UPDATE claim SET admin_id = ?, status_log = CONCAT(IFNULL(status_log, ''), ?) WHERE claim_id = ?",
                         [stepConfig.targetAdminId, '\nClaim escalated and reassigned.', claimId]);
                     console.log(`[WF Engine] Escalated claim ${claimId} assignment to admin ${stepConfig.targetAdminId}`);
                }
                else {
                     console.warn(`[WF Engine] Unknown rule name: ${stepConfig.ruleName}`);
                     // Decide: should unknown rule halt or proceed? Let's proceed for now.
                }
                if (!skipNextStepLogic) stepCompleted = true; // Mark step as done unless branch halted
                break;

            case 'MANUAL':
                console.log(`[WF Engine] Waiting for MANUAL action. Assigned: ${claim.admin_id || stepConfig.assignedRole || 'Unspecified Role'}`);
                // The engine pauses here. Status should be PENDING.
                stepCompleted = false;
                break;

            case 'TIMER':
                const delaySeconds = stepConfig.durationSeconds || 60; // Default 1 min if not specified
                console.log(`[WF Engine] Starting TIMER: Wait for ${delaySeconds} seconds.`);
                // IMPORTANT: setTimeout is NOT persistent. Production needs a job queue.
                setTimeout(async () => {
                    console.log(`[WF Engine] TIMER completed for claim ${claimId} after ${delaySeconds}s.`);
                    let timerConnection;
                    try {
                        timerConnection = await mysql.createConnection(dbConfig);
                        // Only advance if the claim is *still* on the timer step
                        const [updateResult] = await timerConnection.execute(
                            'UPDATE claim SET current_step_order = ? WHERE claim_id = ? AND current_step_order = ?',
                            [nextStepOrder, claimId, currentStepOrder] // Use pre-calculated next step
                        );
                        await timerConnection.end();

                        if (updateResult.affectedRows > 0) {
                             console.log(`[WF Engine] Timer advanced claim ${claimId} to step ${nextStepOrder}. Triggering engine.`);
                             setImmediate(() => executeWorkflowStep(claimId)); // Trigger next step
                        } else {
                             console.log(`[WF Engine] Timer finished for claim ${claimId}, but it was already advanced or completed.`);
                        }
                    } catch (timerError) {
                        console.error(`[WF Engine] Error advancing step after timer for claim ${claimId}:`, timerError);
                         if (timerConnection) await timerConnection.end();
                    }
                }, delaySeconds * 1000);
                // The current step execution finishes immediately, pauses workflow externally.
                stepCompleted = false; // Workflow pauses externally
                skipNextStepLogic = true; // Prevent internal step advancement
                break;

            case 'API':
                console.log('[WF Engine] Executing API call (Placeholder):', stepConfig.task);
                // Placeholder for Notification/API calls
                if (stepConfig.task === 'sendNotification') {
                     if (!stepConfig.template) throw new Error("Missing template in sendNotification API config.");
                     console.log(`[WF Engine] Sending notification '${stepConfig.template}' for claim ${claimId}.`);
                     // TODO: Implement actual notification logic (email, etc.)
                } else {
                     console.warn(`[WF Engine] Unknown API task: ${stepConfig.task}`);
                     // Decide: should unknown API task halt or proceed? Let's proceed.
                }
                stepCompleted = true; // Assume success for now
                break;

            default:
                console.error(`[WF Engine] Unknown task type: ${currentStep.task_type}`);
                stepCompleted = false;
                nextStepOrder = null; // Halt workflow
                await connection.execute('UPDATE claim SET current_step_order = NULL, status_log = CONCAT(IFNULL(status_log, \'\'), ?) WHERE claim_id = ?',
                     [`\nWorkflow Error: Unknown task type '${currentStep.task_type}' at step ${currentStepOrder}.`, claimId]);
        }

        // 4. Advance workflow if step completed (and not handled asynchronously)
        if (stepCompleted && !skipNextStepLogic) {
            console.log(`[WF Engine] Advancing workflow for claim ${claimId} from ${currentStepOrder} to step ${nextStepOrder}`);
            await connection.execute(
                'UPDATE claim SET current_step_order = ? WHERE claim_id = ?',
                [nextStepOrder, claimId] // Update to next step (could be null if last step)
            );
            await connection.commit(); // Commit transaction for this step
            // Recursively call for the next step only if there is one
            if (nextStepOrder !== null) {
                setImmediate(() => executeWorkflowStep(claimId));
            } else {
                console.log(`[WF Engine] Workflow for claim ${claimId} finished after step ${currentStepOrder}.`);
            }
        } else if (skipNextStepLogic && nextStepOrder === null) {
             console.log(`[WF Engine] Workflow branch halted for claim ${claimId}.`);
             await connection.commit(); // Commit the halt/completion
        } else if (skipNextStepLogic) {
             console.log(`[WF Engine] Step ${currentStepOrder} initiated async action (Timer). Main execution pauses for claim ${claimId}.`);
             await connection.commit(); // Commit the state before async action takes over
        } else {
            console.log(`[WF Engine] Workflow paused at step ${currentStepOrder} for claim ${claimId} (Manual/Error).`);
            await connection.commit(); // Commit the paused state
        }

    } catch (error) {
        console.error(`[WF Engine] CRITICAL Error processing workflow for claim ${claimId}:`, error);
        if (connection) {
             try { await connection.rollback(); } catch (rbError) { console.error("Rollback failed:", rbError); }
        }
        // Attempt to update claim status to indicate error
        try {
             connection = await mysql.createConnection(dbConfig); // Reconnect if needed
             await connection.execute('UPDATE claim SET current_step_order = NULL, status_log = CONCAT(IFNULL(status_log, \'\'), ?) WHERE claim_id = ?',
                 [`\nWorkflow Engine CRITICAL Error: ${error.message}`, claimId]);
        } catch (dbError) {
             console.error(`[WF Engine] Failed to update claim ${claimId} status after critical workflow error:`, dbError);
        }
    } finally {
        // Ensure connection is closed reliably
        if (connection && connection.connection._closing === false) {
             try { await connection.end(); } catch (endError) { console.error("Failed to close connection:", endError); }
        }
    }
}


// --- 6. Public API Endpoints ---
// ... (Your existing /api/quote, /api/register, /api/login, /api/admin/login endpoints - no changes) ...
// Quote Generation Endpoint
app.post('/api/quote', async (req, res) => {
    let connection;
    try {
        const { customer_id, policy_id } = req.body;
        if (!customer_id || !policy_id) {
             return res.status(400).json({ error: 'Customer ID and Policy ID are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT c.dob, p.premium_amount AS base_premium
             FROM customer c JOIN policy p ON p.policy_id = ?
             WHERE c.customer_id = ?`,
            [policy_id, customer_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer or Policy template not found' });
        }

        const { dob, base_premium } = rows[0];
        if (!dob || base_premium == null) {
            return res.status(400).json({ error: 'Missing required data (DOB or Base Premium) for calculation.' });
        }
        const basePremiumNum = parseFloat(base_premium);
        if (isNaN(basePremiumNum)) return res.status(400).json({ error: 'Invalid base premium value.'});


        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return res.status(400).json({ error: 'Invalid date of birth.'});
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        let finalPremium = basePremiumNum;
        let discount = 0;

        // Example Rule
        if (age > 40 && policy_id === 'POL1002') {
            discount = basePremiumNum * 0.08;
            finalPremium = basePremiumNum - discount;
        }

        res.json({ customer_id, policy_id, age, base_premium: basePremiumNum, discount, final_premium: finalPremium });

    } catch (error) {
        console.error('Error generating quote:', error);
        res.status(500).json({ error: 'Internal server error during quote generation.' });
    } finally {
        if (connection) await connection.end();
    }
});

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    let connection;
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        // Basic email format check
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }
        // Basic password length check
        if (password.length < 6) {
             return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }


        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const customer_id = 'CUST_' + Date.now();

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO customer (customer_id, name, email, password) VALUES (?, ?, ?, ?)`,
            [customer_id, name, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully!', customer_id });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error during registration.' });
    } finally {
        if (connection) await connection.end();
    }
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
             return res.status(400).json({ error: 'Email and password are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute( `SELECT * FROM customer WHERE email = ?`, [email] );

        if (rows.length === 0) {
            // [AUDIT] Log failed login (user not found)
            logAuditEvent(email, 'CUSTOMER', 'LOGIN_FAILED_USER_NOT_FOUND', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // User not found
        }
        const user = rows[0];
        if (!user.password) {
             console.error(`User ${user.customer_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            // [AUDIT] Log failed login (wrong password)
            logAuditEvent(user.customer_id, 'CUSTOMER', 'LOGIN_FAILED_PASSWORD', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

        // [AUDIT] Log successful login
        logAuditEvent(user.customer_id, 'CUSTOMER', 'LOGIN_SUCCESS');

        // Generate JWT for customer
        const token = jwt.sign(
            { customer_id: user.customer_id, name: user.name, email: user.email, isAdmin: false },
            JWT_SECRET, { expiresIn: '1h' }
        );

        res.json({ message: 'Login successful!', token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Admin Login Endpoint
app.post('/api/admin/login', async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
             return res.status(400).json({ error: 'Email and password are required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute( `SELECT * FROM administrator WHERE email = ?`, [email] );

        if (rows.length === 0) {
            // [AUDIT] Log failed admin login (user not found)
            logAuditEvent(email, 'ADMIN', 'ADMIN_LOGIN_FAILED_USER_NOT_FOUND', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Admin not found
        }
        const admin = rows[0];
        if (!admin.password) {
             console.error(`Admin ${admin.admin_id} has no password set.`);
             return res.status(401).json({ error: 'Invalid email or password' }); // Account issue
        }

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            // [AUDIT] Log failed admin login (wrong password)
            logAuditEvent(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_FAILED_PASSWORD', null, { email: email });
            return res.status(401).json({ error: 'Invalid email or password' }); // Password mismatch
        }

        // [AUDIT] Log successful admin login
        logAuditEvent(admin.admin_id, 'ADMIN', 'ADMIN_LOGIN_SUCCESS');

        // Generate JWT for admin
        const token = jwt.sign(
            { admin_id: admin.admin_id, name: admin.name, role: admin.role, isAdmin: true },
            JWT_SECRET, { expiresIn: '1h' }
        );

        res.json({ message: 'Admin login successful!', token });

    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ error: 'Internal server error during admin login.' });
    } finally {
        if (connection) await connection.end();
    }
});

// --- 7. Secure Customer API Endpoints ---

// Get Claims for Logged-in Customer
// ... (Your existing /api/my-claims GET endpoint - no changes) ...
app.get('/api/my-claims', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT claim_id, description, claim_date, claim_status, amount
             FROM claim WHERE customer_id = ? ORDER BY claim_date DESC`,
            [customer_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ error: 'Internal server error fetching claims.' });
    } finally {
        if (connection) await connection.end();
    }
});


// File a New Claim for Logged-in Customer (Triggers Workflow)
// ... (Your existing /api/my-claims POST endpoint - no changes) ...
app.post('/api/my-claims', checkAuth, async (req, res) => {
    let connection;
    let claim_id; // Define claim_id outside try for use in triggering
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;
        const { policy_id, description, amount } = req.body;

        if (!policy_id || !description || amount == null) {
            return res.status(400).json({ error: 'Policy ID, description, and amount are required.' });
        }
        const claimAmount = parseFloat(amount);
        if (isNaN(claimAmount) || claimAmount <= 0) {
             return res.status(400).json({ error: 'Invalid claim amount.' });
        }

        claim_id = 'CLM_' + Date.now(); // Assign value here
        const workflow_id_to_assign = 'CLAIM_APPROVAL_V1';

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction(); // Start transaction

        // Ensure default workflow exists to satisfy FK (foolproof)
        try {
            // Detect proper column name (workflow_name vs name)
            const [wfNameCol] = await connection.execute(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflows' 
                 AND COLUMN_NAME IN ('workflow_name','name') LIMIT 1`
            );
            const nameCol = (wfNameCol[0] && wfNameCol[0].COLUMN_NAME) || 'workflow_name';
            const [wfExists] = await connection.execute(
                'SELECT 1 FROM workflows WHERE workflow_id = ? LIMIT 1',
                [workflow_id_to_assign]
            );
            if (wfExists.length === 0) {
                await connection.execute(
                    `INSERT INTO workflows (workflow_id, ${nameCol}, description) VALUES (?, ?, ?)`,
                    [workflow_id_to_assign, 'Claim Approval (Default)', 'Default workflow created automatically']
                );
            }
        } catch (wfErr) {
            console.warn('[Claim Filing] Could not verify/create default workflow (non-fatal):', wfErr.code || wfErr.message);
            // Continue even if we cannot create it; FK may be nullable in some schemas.
        }

        // Verify policy belongs to customer
        const [policyCheck] = await connection.execute(
             `SELECT 1 FROM customer_policy WHERE customer_id = ? AND policy_id = ?`,
             [customer_id, policy_id]
        );
        if (policyCheck.length === 0) {
             await connection.rollback();
             console.error(`Policy validation failed: Policy ${policy_id} does not belong to customer ${customer_id}`);
             return res.status(403).json({ 
                 error: `Policy ${policy_id} is not linked to your account. This may be a database issue - please contact support or try a different policy.` 
             });
        }
        
        // Additional check: Verify policy exists and get its status
        const [policyInfo] = await connection.execute(
             `SELECT policy_id, status FROM policy WHERE policy_id = ?`,
             [policy_id]
        );
        if (policyInfo.length === 0) {
             await connection.rollback();
             console.error(`Policy ${policy_id} does not exist in policy table`);
             return res.status(404).json({ error: `Policy ${policy_id} not found in system.` });
        }
        console.log(`Claim filing: Customer ${customer_id}, Policy ${policy_id} (${policyInfo[0].status}), Amount ${claimAmount}`);

        // Calculate risk score based on amount and other factors
        let riskScore = 0;
        
        // Amount-based risk (scale of 0-10)
        if (claimAmount < 10000) {
            riskScore = 1;
        } else if (claimAmount < 50000) {
            riskScore = 2;
        } else if (claimAmount < 100000) {
            riskScore = 3;
        } else if (claimAmount < 500000) {
            riskScore = 5;
        } else if (claimAmount < 1000000) {
            riskScore = 7;
        } else if (claimAmount < 5000000) {
            riskScore = 8;
        } else if (claimAmount < 10000000) {
            riskScore = 9;
        } else {
            riskScore = 10; // Very high risk for claims > 10M
        }

        // Check customer's claim history to adjust risk
        const [claimHistory] = await connection.execute(
            `SELECT COUNT(*) as claim_count, 
                    SUM(CASE WHEN claim_status = 'DECLINED' THEN 1 ELSE 0 END) as declined_count
             FROM claim 
             WHERE customer_id = ?`,
            [customer_id]
        );
        
        if (claimHistory.length > 0) {
            const history = claimHistory[0];
            // Increase risk if customer has multiple claims
            if (history.claim_count > 5) riskScore = Math.min(10, riskScore + 1);
            // Increase risk if customer has declined claims
            if (history.declined_count > 0) riskScore = Math.min(10, riskScore + 1);
        }

        console.log(`Calculated risk score: ${riskScore} for claim ${claim_id}`);

        // Insert claim WITH workflow details and risk score
        await connection.execute(
            `INSERT INTO claim (claim_id, policy_id, customer_id, description, claim_date, claim_status, amount, status_log, workflow_id, current_step_order, risk_score)
             VALUES (?, ?, ?, ?, CURDATE(), 'PENDING', ?, ?, ?, 1, ?)`,
            [claim_id, policy_id, customer_id, description, claimAmount, 'Claim submitted by user.', workflow_id_to_assign, riskScore]
        );

        await connection.commit(); // Commit transaction
        await connection.end(); // Close connection BEFORE triggering workflow

        res.status(201).json({ message: 'Claim filed successfully!', claim_id });

        // --- Trigger Workflow Execution Asynchronously ---
        if (claim_id) { // Ensure claim_id was set
             setImmediate(() => executeWorkflowStep(claim_id));
        }

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('Error filing claim:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        
        // Provide more specific error messages
        let errorMessage = 'Internal server error filing claim.';
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            errorMessage = 'Reference not found. Ensure policy, customer, and workflow exist.';
        } else if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Duplicate claim detected. This claim may already exist.';
        }
        
        res.status(500).json({ error: errorMessage });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});


// --- [NEW] Get Policies for Logged-in Customer ---
app.get('/api/my-policies', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Access denied.' });
        const customer_id = req.user.customer_id;

        connection = await mysql.createConnection(dbConfig);
        // Join customer_policy with policy to get details
        const [rows] = await connection.execute(
            `SELECT p.policy_id, p.policy_type, p.premium_amount, p.status, p.start_date, p.end_date
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE cp.customer_id = ?
             ORDER BY p.policy_date DESC`,
            [customer_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customer policies:', error);
        res.status(500).json({ error: 'Internal server error fetching policies.' });
    } finally {
        if (connection) await connection.end();
    }
});


// --- [NEW] Policy Catalog (Public offerings) ---
// Returns a simple list of available policy products to purchase
app.get('/api/policy-catalog', checkAuth, async (req, res) => {
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Admins cannot purchase customer policies.' });
        // Comprehensive catalog modeled after real insurance products
        const catalog = [
            // Health Insurance
            {
                product_id: 'CAT_HEALTH_BASIC',
                policy_type: 'HEALTH',
                name: 'Health Shield Basic',
                premium_amount: 8500.00,
                coverage_amount: 300000.00,
                coverage_details: 'Essential health coverage including hospitalization, doctor visits, prescription drugs, and preventive care',
                term_months: 12,
                popular: false,
                features: ['Hospitalization Coverage', 'Generic Medications', 'Annual Check-up', 'Emergency Care']
            },
            {
                product_id: 'CAT_HEALTH_PREMIUM',
                policy_type: 'HEALTH',
                name: 'Health Shield Premium',
                premium_amount: 18500.00,
                coverage_amount: 1000000.00,
                coverage_details: 'Comprehensive health insurance with extensive coverage for hospitalization, surgeries, specialist visits, dental, and vision care',
                term_months: 12,
                popular: true,
                features: ['Full Hospitalization', 'Surgery Coverage', 'Dental & Vision', 'Specialist Consultations', 'Prescription Drugs', 'Mental Health']
            },
            {
                product_id: 'CAT_HEALTH_FAMILY',
                policy_type: 'HEALTH',
                name: 'Family Health Plus',
                premium_amount: 32000.00,
                coverage_amount: 2000000.00,
                coverage_details: 'Complete family health plan covering up to 4 members with maternity, pediatric care, and chronic disease management',
                term_months: 12,
                popular: true,
                features: ['Family Coverage (4 members)', 'Maternity Care', 'Pediatric Services', 'Chronic Disease Management', 'Wellness Programs']
            },
            
            // Life Insurance
            {
                product_id: 'CAT_LIFE_TERM',
                policy_type: 'LIFE',
                name: 'Term Life Secure',
                premium_amount: 12000.00,
                coverage_amount: 5000000.00,
                coverage_details: 'Pure term life insurance providing financial protection for your family with high coverage at affordable rates',
                term_months: 12,
                popular: false,
                features: ['High Coverage Amount', 'Affordable Premium', 'No Medical Exam (under 50)', 'Accidental Death Benefit']
            },
            {
                product_id: 'CAT_LIFE_WHOLE',
                policy_type: 'LIFE',
                name: 'Whole Life Guardian',
                premium_amount: 28000.00,
                coverage_amount: 3000000.00,
                coverage_details: 'Lifetime coverage with guaranteed cash value accumulation and tax-deferred growth',
                term_months: 12,
                popular: false,
                features: ['Lifetime Coverage', 'Cash Value Growth', 'Policy Loans Available', 'Tax Benefits', 'Guaranteed Payout']
            },
            
            // Auto Insurance
            {
                product_id: 'CAT_AUTO_COMPREHENSIVE',
                policy_type: 'AUTO',
                name: 'Auto Shield Comprehensive',
                premium_amount: 15000.00,
                coverage_amount: 1500000.00,
                coverage_details: 'Complete auto coverage including collision, comprehensive, liability, personal injury, and roadside assistance',
                term_months: 12,
                popular: true,
                features: ['Collision Coverage', 'Theft & Vandalism', 'Third-party Liability', '24/7 Roadside Assistance', 'Glass Coverage']
            },
            {
                product_id: 'CAT_AUTO_THIRD_PARTY',
                policy_type: 'AUTO',
                name: 'Third Party Auto Coverage',
                premium_amount: 5500.00,
                coverage_amount: 500000.00,
                coverage_details: 'Mandatory third-party liability coverage protecting you against legal claims from accidents',
                term_months: 12,
                popular: false,
                features: ['Legal Liability Protection', 'Third-party Damage', 'Personal Injury Coverage', 'Court Defense']
            },
            
            // Home Insurance
            {
                product_id: 'CAT_HOME_STANDARD',
                policy_type: 'HOME',
                name: 'Home Protect Standard',
                premium_amount: 9500.00,
                coverage_amount: 2500000.00,
                coverage_details: 'Essential home insurance covering structure, personal property, and liability protection',
                term_months: 12,
                popular: false,
                features: ['Structural Damage', 'Contents Coverage', 'Fire & Natural Disasters', 'Theft Protection', 'Liability Coverage']
            },
            {
                product_id: 'CAT_HOME_PREMIUM',
                policy_type: 'HOME',
                name: 'Home Protect Elite',
                premium_amount: 22000.00,
                coverage_amount: 7500000.00,
                coverage_details: 'Premium home protection with extended coverage for high-value items, natural disasters, and additional living expenses',
                term_months: 12,
                popular: false,
                features: ['Full Structure Coverage', 'High-value Items', 'Natural Disaster Protection', 'Temporary Housing', 'Home Office Equipment']
            },
            
            // Travel Insurance
            {
                product_id: 'CAT_TRAVEL_DOMESTIC',
                policy_type: 'TRAVEL',
                name: 'Travel Safe Domestic',
                premium_amount: 1200.00,
                coverage_amount: 200000.00,
                coverage_details: 'Domestic travel coverage for trip cancellations, medical emergencies, and baggage loss',
                term_months: 1,
                popular: false,
                features: ['Trip Cancellation', 'Medical Emergency', 'Baggage Loss', 'Travel Delays', 'Personal Liability']
            },
            {
                product_id: 'CAT_TRAVEL_INTERNATIONAL',
                policy_type: 'TRAVEL',
                name: 'Global Travel Shield',
                premium_amount: 4500.00,
                coverage_amount: 1000000.00,
                coverage_details: 'Comprehensive international travel insurance with worldwide medical coverage and emergency evacuation',
                term_months: 1,
                popular: true,
                features: ['Worldwide Medical Coverage', 'Emergency Evacuation', 'Trip Cancellation', 'Lost Passport Assistance', '24/7 Support']
            },
            
            // Specialty Insurance
            {
                product_id: 'CAT_CRITICAL_ILLNESS',
                policy_type: 'HEALTH',
                name: 'Critical Illness Cover',
                premium_amount: 16500.00,
                coverage_amount: 2500000.00,
                coverage_details: 'Lump-sum payout upon diagnosis of critical illnesses like cancer, heart attack, or stroke',
                term_months: 12,
                popular: false,
                features: ['Cancer Coverage', 'Heart Disease', 'Stroke Protection', 'Kidney Failure', 'Lump Sum Payout', 'No Medical Bills Required']
            },
            {
                product_id: 'CAT_PERSONAL_ACCIDENT',
                policy_type: 'ACCIDENT',
                name: 'Personal Accident Guard',
                premium_amount: 3500.00,
                coverage_amount: 1000000.00,
                coverage_details: 'Protection against accidental death, disability, and medical expenses from accidents',
                term_months: 12,
                popular: false,
                features: ['Accidental Death Benefit', 'Permanent Disability', 'Temporary Disability', 'Medical Expenses', 'Ambulance Coverage']
            }
        ];
        res.json(catalog);
    } catch (error) {
        console.error('Error returning policy catalog:', error);
        res.status(500).json({ error: 'Internal server error fetching catalog.' });
    }
});


// --- [NEW] Purchase Policy (Create + Link to customer) ---
app.post('/api/policies/purchase', checkAuth, async (req, res) => {
    let connection;
    try {
        if (req.user.isAdmin) return res.status(403).json({ error: 'Admins cannot purchase customer policies.' });
        const customer_id = req.user.customer_id;
        const { product_id, policy_type, premium_amount, coverage_details } = req.body || {};

        // Basic validation
        const policyType = policy_type || (product_id?.includes('HEALTH') ? 'HEALTH' : product_id?.includes('LIFE') ? 'LIFE' : product_id?.includes('HOME') ? 'HOME' : product_id?.includes('AUTO') ? 'AUTO' : product_id?.includes('TRAVEL') ? 'TRAVEL' : product_id?.includes('ACCIDENT') ? 'ACCIDENT' : null);
        if (!policyType) return res.status(400).json({ error: 'policy_type or a valid product_id is required.' });

        const premium = Number(premium_amount ?? 0);
        if (!isFinite(premium) || premium <= 0) return res.status(400).json({ error: 'premium_amount must be a positive number.' });

        const coverage = coverage_details ?? `Standard ${policyType} coverage`;

        const policy_id = 'POL_' + Date.now();

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Create the policy instance in INACTIVE_AWAITING_PAYMENT status
        await connection.execute(
            `INSERT INTO policy (policy_id, policy_date, start_date, end_date, premium_amount, coverage_details, status, policy_type)
             VALUES (?, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 MONTH), ?, ?, 'INACTIVE_AWAITING_PAYMENT', ?)`,
            [policy_id, premium, coverage, policyType]
        );

        // Link to the customer
        await connection.execute(
            `INSERT INTO customer_policy (customer_id, policy_id) VALUES (?, ?)`,
            [customer_id, policy_id]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Policy created and linked to your account. Please activate it to start coverage.',
            policy: { policy_id, policy_type: policyType, premium_amount: premium, status: 'INACTIVE_AWAITING_PAYMENT' }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error purchasing policy:', error);
        res.status(500).json({ error: 'Internal server error purchasing policy.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});


// --- [NEW] Mock Policy Activation Endpoint ---
app.post('/api/policies/:policyId/mock-activate', checkAuth, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const customer_id = req.user.customer_id; // Get customer ID from authenticated user

    if (req.user.isAdmin) return res.status(403).json({ error: 'Admins cannot activate customer policies.' });

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Verify policy exists, belongs to the customer, and needs payment
        const [policyRows] = await connection.execute(
            `SELECT p.policy_id, p.premium_amount, p.status
             FROM policy p
             JOIN customer_policy cp ON p.policy_id = cp.policy_id
             WHERE p.policy_id = ? AND cp.customer_id = ? FOR UPDATE`, // Lock row
            [policyId, customer_id]
        );

        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found or does not belong to this customer.' });
        }

        const policy = policyRows[0];
        const amountToPay = policy.premium_amount;

        if (policy.status !== 'INACTIVE_AWAITING_PAYMENT') {
            await connection.rollback();
            return res.status(400).json({ error: `Policy status is "${policy.status}", activation not required or already active.` });
        }
        
    // 2a. Create a 'SUCCESS' record in initial_payment table if it exists; otherwise skip
        const payment_id = 'MOCKPAY_' + Date.now();
        const transaction_id = 'MOCK_TXN_' + Date.now();

        try {
            const [tbl] = await connection.execute(
                `SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'initial_payment'`
            );
            if (tbl.length > 0) {
                await connection.execute(
                    `INSERT INTO initial_payment (payment_id, policy_id, customer_id, amount, payment_gateway, transaction_id, payment_status)
                     VALUES (?, ?, ?, ?, 'MOCK_PAYMENT', ?, 'SUCCESS')`,
                    [payment_id, policyId, customer_id, amountToPay, transaction_id]
                );
            } else {
                console.warn('[Mock Activate] initial_payment table not found; skipping insert.');
            }
        } catch (e) {
            console.warn('[Mock Activate] Error inserting into initial_payment (non-fatal):', e.code || e.message);
        }

        // 2b. Also insert a payment into the canonical 'payment' table if it exists to trigger DB notifications
        try {
            // Find the customer_policy_id for this customer-policy pair
            const [cpRows] = await connection.execute(
                `SELECT customer_policy_id FROM customer_policy WHERE customer_id = ? AND policy_id = ? LIMIT 1`,
                [customer_id, policyId]
            );
            if (cpRows.length > 0) {
                const customer_policy_id = cpRows[0].customer_policy_id;
                const [tblPay] = await connection.execute(
                    `SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payment'`
                );
                if (tblPay.length > 0) {
                    const paymentId2 = payment_id + '_CANON';
                    await connection.execute(
                        `INSERT INTO payment (payment_id, customer_policy_id, status, payment_date, payment_mode)
                         VALUES (?, ?, 'Success', NOW(), 'MOCK_PAYMENT')`,
                        [paymentId2, customer_policy_id]
                    );
                }
            }
        } catch (e) {
            console.warn('[Mock Activate] Skipping canonical payment insert (non-fatal):', e.code || e.message);
        }

        // 3. Update the policy status to ACTIVE
        await connection.execute(
            `UPDATE policy SET status = 'ACTIVE'
             WHERE policy_id = ? AND status = 'INACTIVE_AWAITING_PAYMENT'`,
            [policyId]
        );

        await connection.commit();

        // 4. Send success response
        res.json({
            message: 'Policy activated successfully (mock payment)!',
            paymentId: payment_id,
            transaction_id: transaction_id
         });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error in mock activation for policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during mock activation.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});


// --- 8. Secure Admin API Endpoints ---
// ... (Your existing Admin endpoints - no changes) ...
// Get All PENDING Claims (Admin Only)
app.get('/api/admin/pending-claims', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Join with customer table to get customer name
        const [rows] = await connection.execute(
            `SELECT c.claim_id, c.customer_id, cu.name as customer_name, c.description, c.claim_date, c.amount
             FROM claim c
             JOIN customer cu ON c.customer_id = cu.customer_id
             WHERE c.claim_status = 'PENDING'
             ORDER BY c.claim_date ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending claims:', error);
        res.status(500).json({ error: 'Internal server error fetching pending claims.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Update a Claim Status (Admin Only - Triggers Workflow)
app.patch('/api/admin/claims/:claimId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const claimId = req.params.claimId; // Define claimId in outer scope
    let nextStepOrder = null; // Define nextStepOrder in outer scope
    const { newStatus } = req.body; // Get newStatus early
    const adminId = req.user.admin_id; // Get adminId from JWT

    try {
        if (newStatus !== 'APPROVED' && newStatus !== 'DECLINED') {
            return res.status(400).json({ error: 'Invalid status provided. Must be APPROVED or DECLINED.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get current step order and workflow ID (Lock row)
        const [claimRows] = await connection.execute('SELECT current_step_order, workflow_id, claim_status FROM claim WHERE claim_id = ? AND claim_status = \'PENDING\' FOR UPDATE', [claimId]);
        
        if (claimRows.length === 0) {
             await connection.rollback();
             return res.status(404).json({ error: 'Claim not found or was not in PENDING status.' }); // More specific error
        }
        
        const oldStatus = claimRows[0].claim_status; // Should be 'PENDING'
        const currentStepBeforeUpdate = claimRows[0].current_step_order;
        const workflowId = claimRows[0].workflow_id;

        // 2. Find the *next* defined step in the workflow to jump to
        if (workflowId && currentStepBeforeUpdate != null) {
            const [nextStepRows] = await connection.execute(
                 'SELECT MIN(step_order) as next_order FROM workflow_steps WHERE workflow_id = ? AND step_order > ?',
                 [workflowId, currentStepBeforeUpdate]
            );
            if (nextStepRows.length > 0 && nextStepRows[0].next_order != null) {
                nextStepOrder = nextStepRows[0].next_order;
            } else {
                 console.log(`[WF Update] No steps found after step ${currentStepBeforeUpdate} for workflow ${workflowId}. Marking complete.`);
                 // nextStepOrder remains null
            }
        } else {
             console.log(`[WF Update] Claim ${claimId} has no workflow or is already complete. Setting next step to NULL.`);
             // nextStepOrder remains null
        }

        // 3. Update the claim status, log, and step order
        const logMessage = `\nClaim ${newStatus.toLowerCase()} by admin ${adminId}.`;
        const [result] = await connection.execute(
            `UPDATE claim SET claim_status = ?, status_log = CONCAT(IFNULL(status_log, ''), ?), current_step_order = ?
             WHERE claim_id = ? AND claim_status = 'PENDING'`,
            [newStatus, logMessage, nextStepOrder, claimId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(409).json({ error: 'Claim status might have changed, or claim not found.' });
        }

        await connection.commit(); // Commit the transaction
        await connection.end(); // Close connection BEFORE logging and triggering workflow

        // --- [NEW] AUDIT LOGGING ---
        // Log this sensitive action AFTER the transaction is committed
        logAuditEvent(adminId, 'ADMIN', `CLAIM_STATUS_UPDATE_${newStatus}`, claimId, { oldStatus: oldStatus, newStatus: newStatus });

        res.json({ message: `Claim ${claimId} status updated to ${newStatus}.` });

        // --- Trigger Next Workflow Step (if any) ---
        if (nextStepOrder !== null) {
             setImmediate(() => executeWorkflowStep(claimId));
        } else {
             console.log(`[WF Update] Workflow for claim ${claimId} considered complete after manual action.`);
        }

    } catch (error) {
        console.error('Error updating claim status:', error);
        if (connection) await connection.rollback(); // Rollback on any error
        res.status(500).json({ error: 'Internal server error updating claim status.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});

// Get All PENDING Policies (Admin Only)
app.get('/api/admin/pending-policies', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Join with administrator table to get the name of the initial approver, if one exists
        const [rows] = await connection.execute(
            `SELECT 
                p.policy_id, 
                p.policy_type, 
                p.premium_amount,
                p.status, 
                p.initial_approver_id,
                a.name as initial_approver_name,
                p.initial_approval_date
             FROM policy p
             LEFT JOIN administrator a ON p.initial_approver_id = a.admin_id
             WHERE p.status = 'PENDING_INITIAL_APPROVAL' OR p.status = 'PENDING_FINAL_APPROVAL'
             ORDER BY p.policy_date ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending policies:', error);
        res.status(500).json({ error: 'Internal server error fetching pending policies.' });
    } finally {
        if (connection) await connection.end();
    }
});


app.patch('/api/admin/policies/:policyId/approve', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    const { policyId } = req.params;
    const { admin_id: currentAdminId, role: currentAdminRole } = req.user; // Get details from JWT

    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Get the current policy state (and lock the row)
        const [policyRows] = await connection.execute(
            'SELECT policy_id, status, initial_approver_id FROM policy WHERE policy_id = ? FOR UPDATE',
            [policyId]
        );

        if (policyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Policy not found.' });
        }
        
        const policy = policyRows[0];
        let logMessage = "";
        let newStatus = "";

        // 2. State Machine Logic
        if (policy.status === 'PENDING_INITIAL_APPROVAL') {
            // --- Action: Initial Approval ---
            newStatus = 'PENDING_FINAL_APPROVAL';
            await connection.execute(
                `UPDATE policy SET 
                    status = ?, 
                    initial_approver_id = ?, 
                    initial_approval_date = NOW()
                 WHERE policy_id = ?`,
                [newStatus, currentAdminId, policyId]
            );
            logMessage = `Policy ${policyId} moved to PENDING_FINAL_APPROVAL by ${currentAdminId}.`;

        } else if (policy.status === 'PENDING_FINAL_APPROVAL') {
            // --- Action: Final Approval (with checks) ---
            
            // Check 1: Role check
            if (currentAdminRole !== 'Security Officer') {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Final approval requires "Security Officer" role.' });
            }

            // Check 2: Four-Eyes check (different user)
            if (policy.initial_approver_id === currentAdminId) {
                await connection.rollback();
                return res.status(403).json({ error: 'Forbidden: Four-eyes principle violation. Final approver must be different from the initial approver.' });
            }

            // All checks passed
            newStatus = 'INACTIVE_AWAITING_PAYMENT';
            await connection.execute(
                `UPDATE policy SET 
                    status = ?, 
                    final_approver_id = ?, 
                    final_approval_date = NOW()
                 WHERE policy_id = ?`,
                [newStatus, currentAdminId, policyId]
            );
            logMessage = `Policy ${policyId} approved by ${currentAdminId}. Status: INACTIVE_AWAITING_PAYMENT (customer must pay to activate).`;

        } else {
            // --- Action: No action needed ---
            await connection.rollback();
            return res.status(400).json({ error: `Policy is in status "${policy.status}" and cannot be approved.` });
        }

        // 3. Commit and respond
        await connection.commit();
        console.log(logMessage);
        res.json({ message: 'Policy approval status updated successfully!', newState: newStatus });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error approving policy ${policyId}:`, error);
        res.status(500).json({ error: 'Internal server error during policy approval.' });
    } finally {
        if (connection && connection.connection._closing === false) await connection.end();
    }
});


// --- 9. Admin Endpoints for Workflow Management ---
// ... (Your existing Workflow endpoints - no changes) ...
// Get all workflows
app.get('/api/admin/workflows', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [workflows] = await connection.execute('SELECT workflow_id, name, description FROM workflows ORDER BY name');
        res.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Internal server error fetching workflows.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Get a single workflow (including its steps)
app.get('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        connection = await mysql.createConnection(dbConfig);
        const [workflowRows] = await connection.execute( 'SELECT * FROM workflows WHERE workflow_id = ?', [workflowId] );

        if (workflowRows.length === 0) {
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }
        const [stepsRows] = await connection.execute(
             'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [workflowId]
         );

        const workflowData = workflowRows[0];
        // Safely parse configuration JSON for each step
        workflowData.steps = stepsRows.map(step => {
             let config = {};
             try {
                  config = step.configuration ? JSON.parse(step.configuration) : {};
             } catch(e) {
                  console.error(`Invalid JSON configuration for step ${step.step_id}: ${step.configuration}`);
                  // Return empty object or specific error structure if needed
             }
             return { ...step, configuration: config };
        });
        res.json(workflowData);
    } catch (error) {
        console.error(`Error fetching workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error fetching workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Get steps for a specific workflow (redundant, consider removing later)
app.get('/api/admin/workflows/:workflowId/steps', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        connection = await mysql.createConnection(dbConfig);
        const [steps] = await connection.execute(
            'SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order', [workflowId]
        );
         // Safely parse configuration
        const parsedSteps = steps.map(step => {
             let config = {};
             try {
                  config = step.configuration ? JSON.parse(step.configuration) : {};
             } catch(e) {
                 console.error(`Invalid JSON configuration for step ${step.step_id} (steps endpoint): ${step.configuration}`);
             }
            return { ...step, configuration: config };
        });
        res.json(parsedSteps);
    } catch (error) {
        console.error(`Error fetching steps for workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error fetching workflow steps.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Create a new workflow
app.post('/api/admin/workflows', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflow_id, name, description } = req.body;
        if (!workflow_id || !name) {
            return res.status(400).json({ error: 'Workflow ID and Name are required.' });
        }
        // Basic ID format validation (e.g., no spaces, uppercase)
         if (!/^[A-Z0-9_]+$/.test(workflow_id)) {
            return res.status(400).json({ error: 'Workflow ID can only contain uppercase letters, numbers, and underscores.' });
        }

        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO workflows (workflow_id, name, description) VALUES (?, ?, ?)',
            [workflow_id, name, description || null]
        );
        res.status(201).json({ message: 'Workflow created successfully!', workflow_id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: `Workflow ID '${req.body.workflow_id}' already exists.` });
        }
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Internal server error creating workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Update workflow details (name/description)
app.put('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Workflow Name is required.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'UPDATE workflows SET name = ?, description = ? WHERE workflow_id = ?',
            [name, description || null, workflowId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }
        res.json({ message: `Workflow ${workflowId} updated successfully.` });
    } catch (error) {
        console.error(`Error updating workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error updating workflow.' });
    } finally {
        if (connection) await connection.end();
    }
});


// Add a step to a workflow
app.post('/api/admin/workflows/:workflowId/steps', checkAuth, checkAdmin, async (req, res) => {
     let connection;
     try {
        const workflowId = req.params.workflowId;
        const { step_order, step_name, task_type, configuration } = req.body;

        if (step_order == null || !step_name || !task_type) {
            return res.status(400).json({ error: 'Step order, name, and task type are required.'});
        }
        const orderNum = parseInt(step_order, 10);
        if (isNaN(orderNum) || orderNum <= 0) {
            return res.status(400).json({ error: 'Step order must be a positive integer.'});
        }

        const validTypes = ['MANUAL', 'API', 'RULE'];
        if (!validTypes.includes(task_type)) {
             return res.status(400).json({ error: 'Invalid task type. Must be MANUAL, API, or RULE.' });
        }
        // Ensure configuration is an object if provided
        if (configuration != null && typeof configuration !== 'object') {
             return res.status(400).json({ error: 'Configuration must be a valid JSON object or null.' });
        }

        const step_id = `STEP_${workflowId}_${Date.now()}`; // Use timestamp for unique ID

        connection = await mysql.createConnection(dbConfig);
        // Stringify configuration before inserting into JSON column
        await connection.execute(
            `INSERT INTO workflow_steps (step_id, workflow_id, step_order, step_name, task_type, configuration)
             VALUES (?, ?, ?, ?, ?, ?)`,
             [step_id, workflowId, orderNum, step_name, task_type, configuration ? JSON.stringify(configuration) : null]
        );
         res.status(201).json({ message: 'Workflow step added successfully!', step_id });
     } catch (error) {
          // Specific error handling for duplicate step order or invalid workflow ID
          if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('workflow_id_step_order')) {
               return res.status(409).json({ error: `Step order ${req.body.step_order} already exists for workflow ${req.params.workflowId}.` });
          }
           if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('workflow_steps_ibfk_1')) {
               return res.status(404).json({ error: `Workflow ID ${req.params.workflowId} not found.` });
          }
         console.error(`Error adding step to workflow ${req.params.workflowId}:`, error);
         res.status(500).json({ error: 'Internal server error adding workflow step.' });
     } finally {
          if (connection) await connection.end();
     }
});

// Update a specific workflow step
app.put('/api/admin/workflows/:workflowId/steps/:stepId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflowId, stepId } = req.params;
        const { step_order, step_name, task_type, configuration } = req.body;

        // --- Validation ---
        if (step_order == null || !step_name || !task_type) {
            return res.status(400).json({ error: 'Step order, name, and task type are required.'});
        }
        const orderNum = parseInt(step_order, 10);
        if (isNaN(orderNum) || orderNum <= 0) {
            return res.status(400).json({ error: 'Step order must be a positive integer.'});
        }
        const validTypes = ['MANUAL', 'API', 'RULE'];
        if (!validTypes.includes(task_type)) {
             return res.status(400).json({ error: 'Invalid task type.' });
        }
        if (configuration != null && typeof configuration !== 'object') {
             return res.status(400).json({ error: 'Configuration must be a valid JSON object or null.' });
        }
        // --- End Validation ---

        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `UPDATE workflow_steps
             SET step_order = ?, step_name = ?, task_type = ?, configuration = ?
             WHERE step_id = ? AND workflow_id = ?`,
             [
                 orderNum, step_name, task_type,
                 configuration ? JSON.stringify(configuration) : null,
                 stepId, workflowId
             ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Step ID ${stepId} not found in workflow ${workflowId}.` });
        }

        res.json({ message: `Workflow step ${stepId} updated successfully.` });

    } catch (error) {
         // Handle potential duplicate step order on update
         if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('workflow_id_step_order')) {
             return res.status(409).json({ error: `Step order ${req.body.step_order} already exists for workflow ${req.params.workflowId}.` });
         }
        console.error(`Error updating step ${req.params.stepId}:`, error);
        res.status(500).json({ error: 'Internal server error updating workflow step.' });
    } finally {
         if (connection) await connection.end();
    }
});

// Delete a specific workflow step
app.delete('/api/admin/workflows/:workflowId/steps/:stepId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const { workflowId, stepId } = req.params;

        connection = await mysql.createConnection(dbConfig);
        // Optional: Add logic here to update step_order of subsequent steps if necessary
        const [result] = await connection.execute(
            'DELETE FROM workflow_steps WHERE step_id = ? AND workflow_id = ?',
            [stepId, workflowId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Step ID ${stepId} not found in workflow ${workflowId}.` });
        }

        res.json({ message: `Workflow step ${stepId} deleted successfully.` });

    } catch (error) {
        // Handle potential foreign key issues if other tables reference steps
        console.error(`Error deleting step ${req.params.stepId}:`, error);
        res.status(500).json({ error: 'Internal server error deleting workflow step.' });
    } finally {
         if (connection) await connection.end();
    }
});

// Delete an entire workflow (handle steps first)
app.delete('/api/admin/workflows/:workflowId', checkAuth, checkAdmin, async (req, res) => {
    let connection;
    try {
        const workflowId = req.params.workflowId;

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1. Delete associated steps first
        await connection.execute('DELETE FROM workflow_steps WHERE workflow_id = ?', [workflowId]);

        // 2. Delete the workflow itself
        const [result] = await connection.execute('DELETE FROM workflows WHERE workflow_id = ?', [workflowId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Workflow didn't exist
            return res.status(404).json({ error: `Workflow ID ${workflowId} not found.` });
        }

        await connection.commit(); // Commit both deletes
        res.json({ message: `Workflow ${workflowId} and its steps deleted successfully.` });

    } catch (error) {
         if (connection) await connection.rollback();
        // Handle potential foreign key issues if other tables reference workflows (e.g., claim table)
         if (error.code === 'ER_ROW_IS_REFERENCED_2' && error.sqlMessage.includes('fk_claim_workflow')) {
              return res.status(400).json({ error: `Cannot delete workflow ${req.params.workflowId} as it is currently assigned to one or more claims.` });
         }
        console.error(`Error deleting workflow ${req.params.workflowId}:`, error);
        res.status(500).json({ error: 'Internal server error deleting workflow.' });
    } finally {
         if (connection && connection.connection._closing === false) await connection.end();
    }
});


// (Your existing middlewares, workflow engine, and all routes remain the same)
// Everything up to the last admin workflow route stays unchanged.
// Just scroll to the end to find the new Epic 2 sections below 👇

// ================================================================
// =============== EPIC 2 FEATURE EXTENSIONS ======================
// ================================================================

// --- IWAS-F-012: Claims Adjuster Dashboard ---
app.get('/api/adjuster/dashboard/:adminId', async (req, res) => {
  let connection;
  try {
    const { adminId } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT claim_id, customer_id, description, claim_status, amount, claim_date
       FROM claim
       WHERE admin_id = ?
       ORDER BY claim_date DESC`,
      [adminId]
    );

    res.json({ admin_id: adminId, assigned_claims: rows });
  } catch (error) {
    console.error('Error fetching adjuster dashboard:', error);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-013: Intelligent Document Processing (Mock) ---
const upload = multer({ dest: 'uploads/' });

app.post('/api/documents/process', upload.single('document'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf8');

    // Enhanced pattern extraction - extracts Claim ID, Policy ID, and Amount from document
    const claimIdMatch = content.match(/Claim\s*ID:\s*([\w]+)/i);
    const policyIdMatch = content.match(/Policy\s*ID:\s*([\w]+)/i);
    const amountMatch = content.match(/Amount:\s*[$₹]?\s*([\d,]+(?:\.\d{2})?)/i);

    // Extract claim ID and check if it looks like a policy ID by mistake
    let claimId = claimIdMatch ? claimIdMatch[1] : null;
    let warning = null;
    
    if (claimId && claimId.startsWith('POL')) {
      warning = 'Warning: Extracted Claim ID looks like a Policy ID. Please verify the document format.';
    }

    const extracted = {
      claim_id: claimId,
      policy_id: policyIdMatch ? policyIdMatch[1] : null,
      amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null,
      confidence: 0.9,
      warning: warning
    };

    fs.unlinkSync(filePath); // clean up uploaded file
    res.json({ message: 'Document processed successfully', extracted });
  } catch (error) {
    console.error('Error processing document:', error);
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({ error: 'Document processing failed' });
  }
});

// --- IWAS-F-014: High-Risk Claim Alerts ---
app.get('/api/alerts/highrisk', checkAuth, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    let rows;
    if (req.user.isAdmin) {
      // Admins see system-wide high risk claims (claims > 100k)
      [rows] = await connection.execute(
        `SELECT claim_id, customer_id, amount, claim_status, 
                CASE 
                  WHEN amount > 50000000 THEN 10
                  WHEN amount > 10000000 THEN 9
                  WHEN amount > 5000000 THEN 8
                  WHEN amount > 1000000 THEN 7
                  WHEN amount > 500000 THEN 6
                  WHEN amount > 100000 THEN 5
                  ELSE 4
                END as risk_score
         FROM claim
         WHERE amount > 100000
         ORDER BY amount DESC`
      );
    } else {
      // Customers see only their own high risk claims
      const customer_id = req.user.customer_id;
      [rows] = await connection.execute(
        `SELECT claim_id, customer_id, amount, claim_status,
                CASE 
                  WHEN amount > 50000000 THEN 10
                  WHEN amount > 10000000 THEN 9
                  WHEN amount > 5000000 THEN 8
                  WHEN amount > 1000000 THEN 7
                  WHEN amount > 500000 THEN 6
                  WHEN amount > 100000 THEN 5
                  ELSE 4
                END as risk_score
         FROM claim
         WHERE amount > 100000
           AND customer_id = ?
         ORDER BY amount DESC`,
         [customer_id]
      );
    }

    res.json({ high_risk_claims: rows });
  } catch (error) {
    console.error('Error fetching high-risk claims:', error);
    res.status(500).json({ error: 'Internal server error fetching high-risk claims.' });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-030: Workflow Metrics Dashboard ---
app.get('/api/metrics/workflows', checkAuth, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const customerId = req.user.customer_id; // Get logged-in customer ID from JWT

    const [rows] = await connection.execute(`
      SELECT w.workflow_id, w.name AS workflow_name,
             COUNT(c.claim_id) AS total_claims,
             AVG(TIMESTAMPDIFF(HOUR, c.claim_date, NOW())) AS avg_processing_time_hrs
      FROM workflows w
      LEFT JOIN claim c ON w.workflow_id = c.workflow_id AND c.customer_id = ?
      GROUP BY w.workflow_id, w.name
      ORDER BY total_claims DESC
    `, [customerId]);

    res.json({ metrics: rows });
  } catch (error) {
    console.error('Error fetching workflow metrics:', error);
    res.status(500).json({ error: 'Internal server error fetching metrics.' });
  } finally {
    if (connection) await connection.end();
  }
});

// --- IWAS-F-031: SLA Overdue Task Report ---
app.get('/api/reports/overdue-tasks', checkAuth, checkAdmin, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Show claims that have been pending for more than 7 days
    const [rows] = await connection.execute(`
      SELECT 
        c.claim_id as step_id,
        c.workflow_id,
        CONCAT('Process Claim ', c.claim_id) AS step_name,
        COALESCE(a.name, 'Unassigned') AS assigned_role,
        c.claim_date as due_date,
        NOW() AS current_time_value,
        TIMESTAMPDIFF(HOUR, c.claim_date, NOW()) AS hours_overdue,
        c.claim_id,
        c.customer_id,
        c.amount,
        cust.name AS customer_name
      FROM claim c
      LEFT JOIN administrator a ON c.admin_id = a.admin_id
      LEFT JOIN customer cust ON c.customer_id = cust.customer_id
      WHERE c.claim_status = 'PENDING'
        AND TIMESTAMPDIFF(DAY, c.claim_date, NOW()) > 7
      ORDER BY hours_overdue DESC
    `);

    res.json({ overdue_tasks: rows });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Internal server error fetching overdue tasks.' });
  } finally {
    if (connection) await connection.end();
  }
});


// --- 10. Start the Server ---
app.listen(port, () => {
    console.log(`✅ Backend API server running at http://localhost:${port}`);
});


// --- [NEW] Notifications API ---
// Get notifications for the logged-in customer
app.get('/api/notifications', checkAuth, async (req, res) => {
    if (req.user.isAdmin) {
        return res.status(400).json({ error: 'Notifications endpoint currently supports customers only.' });
    }
    let connection;
    try {
        const customer_id = req.user.customer_id;
        const statusFilter = (req.query.status || '').toUpperCase(); // optional PENDING/READ
        connection = await mysql.createConnection(dbConfig);
        let sql = `SELECT notification_id, notification_date, status, message, type
                   FROM reminder
                   WHERE customer_id = ?`;
        const params = [customer_id];
        if (statusFilter === 'PENDING' || statusFilter === 'READ') {
            sql += ' AND status = ?';
            params.push(statusFilter);
        }
        sql += ' ORDER BY notification_date DESC';
        const [rows] = await connection.execute(sql, params);
        res.json({ notifications: rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error fetching notifications.' });
    } finally {
        if (connection) await connection.end();
    }
});

// Mark a notification as READ
app.put('/api/notifications/:notificationId/read', checkAuth, async (req, res) => {
    if (req.user.isAdmin) {
        return res.status(400).json({ error: 'Notifications endpoint currently supports customers only.' });
    }
    let connection;
    try {
        const notificationId = req.params.notificationId;
        const customer_id = req.user.customer_id;
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `UPDATE reminder SET status = 'READ' WHERE notification_id = ? AND customer_id = ?`,
            [notificationId, customer_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found.' });
        }
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Internal server error updating notification.' });
    } finally {
        if (connection) await connection.end();
    }
});