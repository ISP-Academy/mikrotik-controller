const express = require('express');
const { RouterOSAPI } = require('routeros');
const { Client } = require('ssh2');
const router = express.Router();

// Helper function to ensure CAKE queue type exists
async function ensureCakeQueueTypeExists(routerConfig) {
    return new Promise((resolve) => {
        const conn = new Client();
        let responseHandled = false;
        
        const timeout = setTimeout(() => {
            if (!responseHandled) {
                responseHandled = true;
                conn.end();
                console.log('Timeout checking CAKE queue type');
                resolve(); // Continue anyway
            }
        }, 10000);
        
        conn.on('ready', () => {
            // First check if CAKE queue type exists
            const checkCommand = '/queue/type/print where name~"cake"';
            
            conn.exec(checkCommand, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    conn.end();
                    if (!responseHandled) {
                        responseHandled = true;
                        console.log('Error checking queue types:', err.message);
                        resolve(); // Continue anyway
                    }
                    return;
                }
                
                let output = '';
                
                stream.on('close', (code, signal) => {
                    clearTimeout(timeout);
                    
                    if (!responseHandled) {
                        responseHandled = true;
                        
                        // Check if CAKE type was found in output
                        const cakeExists = output.toLowerCase().includes('cake');
                        
                        if (cakeExists) {
                            console.log('CAKE queue type already exists');
                            conn.end();
                            resolve();
                        } else {
                            console.log('CAKE queue type not found, creating it...');
                            
                            // Create CAKE queue type via SSH
                            const createCommand = '/queue/type/add name=CAKE kind=cake';
                            
                            conn.exec(createCommand, (err2, stream2) => {
                                if (err2) {
                                    console.log('Error creating CAKE queue type:', err2.message);
                                    conn.end();
                                    resolve(); // Continue anyway
                                    return;
                                }
                                
                                stream2.on('close', () => {
                                    console.log('CAKE queue type created successfully');
                                    conn.end();
                                    resolve();
                                });
                                
                                stream2.on('data', () => {
                                    // Consume data
                                });
                                
                                stream2.stderr.on('data', (data) => {
                                    console.log('Error creating CAKE queue type:', data.toString());
                                });
                            });
                        }
                    }
                });
                
                stream.on('data', (data) => {
                    output += data.toString();
                });
                
                stream.stderr.on('data', (data) => {
                    console.log('Error checking queue types:', data.toString());
                });
            });
        });
        
        conn.on('error', (err) => {
            clearTimeout(timeout);
            if (!responseHandled) {
                responseHandled = true;
                console.log('SSH connection failed for queue type check:', err.message);
                resolve(); // Continue anyway
            }
        });
        
        conn.connect({
            host: routerConfig.ip,
            username: routerConfig.username,
            password: routerConfig.password,
            port: 22,
            readyTimeout: 8000
        });
    });
}

router.post('/connect', async (req, res) => {
    const { ip, username, password } = req.body;
    
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - API may not be enabled')), 8000);
    });
    
    try {
        const api = new RouterOSAPI({
            host: ip,
            user: username,
            password: password,
            port: 8728,
            timeout: 5000
        });
        
        await Promise.race([
            api.connect(),
            timeoutPromise
        ]);
        
        // Automatically fetch system info upon successful connection
        const identity = await api.write('/system/identity/print');
        const resource = await api.write('/system/resource/print');
        const routerboard = await api.write('/system/routerboard/print');
        
        await api.close();
        
        const systemInfo = {
            identity: identity[0] || {},
            resource: resource[0] || {},
            routerboard: routerboard[0] || {}
        };
        
        res.json({ 
            success: true, 
            message: 'Connected successfully',
            systemInfo: systemInfo
        });
    } catch (error) {
        let errorMessage = error.message;
        if (error.message.includes('timeout') || error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection failed - API may not be enabled on router (port 8728)';
        }
        res.json({ success: false, error: errorMessage });
    }
});

router.post('/data', async (req, res) => {
    const { router: routerConfig, type } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: 8728,
            timeout: 10000
        });
        
        await api.connect();
        
        let data;
        switch (type) {
            case 'interfaces':
                data = await api.write('/interface/print');
                break;
            case 'dhcp-leases':
                data = await api.write('/ip/dhcp-server/lease/print');
                break;
            case 'ip-addresses':
                data = await api.write('/ip/address/print');
                break;
            case 'update-check':
                // Get current system info and package info via API
                const systemResource = await api.write('/system/resource/print');
                const packages = await api.write('/system/package/print');
                data = {
                    system: systemResource[0] || {},
                    packages: packages
                };
                break;
            case 'update-versions':
                // This will be handled via SSH to get actual available versions
                data = { message: 'Use SSH endpoint for version check' };
                break;
            case 'system-info':
                data = await api.write('/system/identity/print');
                const resource = await api.write('/system/resource/print');
                data = { identity: data, resource: resource };
                break;
            default:
                throw new Error('Unknown data type');
        }
        
        await api.close();
        res.json({ success: true, data: data });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/command', async (req, res) => {
    const { router: routerConfig, command } = req.body;
    
    const conn = new Client();
    let responseHandled = false;
    
    const timeout = setTimeout(() => {
        if (!responseHandled) {
            responseHandled = true;
            conn.end();
            res.json({ success: false, error: 'SSH connection timeout - SSH may not be enabled on router (port 22)' });
        }
    }, 10000);
    
    conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
            if (err) {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    return res.json({ success: false, error: err.message });
                }
            }
            
            let output = '';
            let errorOutput = '';
            
            stream.on('close', (code, signal) => {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    if (code !== 0 && errorOutput) {
                        res.json({ success: false, error: errorOutput });
                    } else {
                        res.json({ success: true, output: output || 'Command executed successfully' });
                    }
                }
            });
            
            stream.on('data', (data) => {
                output += data.toString();
            });
            
            stream.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
        });
    });
    
    conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!responseHandled) {
            responseHandled = true;
            let errorMessage = err.message;
            if (err.code === 'ECONNREFUSED' || err.message.includes('timeout')) {
                errorMessage = 'SSH connection failed - SSH may not be enabled on router (port 22)';
            }
            res.json({ success: false, error: errorMessage });
        }
    });
    
    conn.connect({
        host: routerConfig.ip,
        username: routerConfig.username,
        password: routerConfig.password,
        port: 22,
        readyTimeout: 8000
    });
});

router.post('/upgrade', async (req, res) => {
    const { router: routerConfig, upgradeType, step } = req.body;
    
    const conn = new Client();
    let responseHandled = false;
    
    const timeout = setTimeout(() => {
        if (!responseHandled) {
            responseHandled = true;
            conn.end();
            res.json({ success: false, error: 'SSH connection timeout during upgrade process' });
        }
    }, 60000); // Longer timeout for upgrade operations
    
    conn.on('ready', () => {
        let command = '';
        
        if (step === 'check') {
            // Step 1: Set channel and check for updates
            if (upgradeType === 'ros7-stable') {
                command = '/system/package/update/set channel=stable; /system/package/update/check-for-update';
            } else if (upgradeType === 'ros6-to-ros7') {
                command = '/system/package/update/set channel=testing; /system/package/update/check-for-update';
            }
        } else if (step === 'download') {
            // Step 2: Download updates
            command = '/system/package/update/download';
        } else if (step === 'reboot') {
            // Step 3: Reboot to install
            command = '/system/reboot';
        }
        
        if (!command) {
            clearTimeout(timeout);
            if (!responseHandled) {
                responseHandled = true;
                res.json({ success: false, error: 'Unknown upgrade step' });
            }
            conn.end();
            return;
        }
        
        conn.exec(command, (err, stream) => {
            if (err) {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    return res.json({ success: false, error: err.message });
                }
            }
            
            let output = '';
            let errorOutput = '';
            
            stream.on('close', (code, signal) => {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    
                    let message = '';
                    if (step === 'check') {
                        message = 'Update check completed. Ready to download.';
                    } else if (step === 'download') {
                        message = 'Updates downloaded successfully. Ready to reboot.';
                    } else if (step === 'reboot') {
                        message = 'Router is rebooting to install updates.';
                    }
                    
                    if (code !== 0 && errorOutput) {
                        res.json({ success: false, error: errorOutput });
                    } else {
                        res.json({ 
                            success: true, 
                            message: message,
                            output: output,
                            step: step + '-complete'
                        });
                    }
                }
            });
            
            stream.on('data', (data) => {
                output += data.toString();
            });
            
            stream.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
        });
    });
    
    conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!responseHandled) {
            responseHandled = true;
            res.json({ success: false, error: `SSH connection failed: ${err.message}` });
        }
    });
    
    conn.connect({
        host: routerConfig.ip,
        username: routerConfig.username,
        password: routerConfig.password,
        port: 22,
        readyTimeout: 15000
    });
});

router.post('/update-versions', async (req, res) => {
    const { router: routerConfig, upgradeType } = req.body;
    
    const conn = new Client();
    let responseHandled = false;
    
    const timeout = setTimeout(() => {
        if (!responseHandled) {
            responseHandled = true;
            conn.end();
            res.json({ success: false, error: 'SSH connection timeout while checking versions' });
        }
    }, 30000);
    
    conn.on('ready', () => {
        let command = '';
        
        // Set channel and check for updates, then print what's available
        if (upgradeType === 'ros7-stable') {
            command = '/system/package/update/set channel=stable; /system/package/update/check-for-update; :delay 3s; /system/package/update/print';
        } else if (upgradeType === 'ros6-to-ros7') {
            command = '/system/package/update/set channel=testing; /system/package/update/check-for-update; :delay 3s; /system/package/update/print';
        }
        
        conn.exec(command, (err, stream) => {
            if (err) {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    return res.json({ success: false, error: err.message });
                }
            }
            
            let output = '';
            let errorOutput = '';
            
            stream.on('close', (code, signal) => {
                clearTimeout(timeout);
                conn.end();
                if (!responseHandled) {
                    responseHandled = true;
                    
                    if (code !== 0 && errorOutput) {
                        res.json({ success: false, error: errorOutput });
                    } else {
                        res.json({ 
                            success: true, 
                            output: output,
                            rawOutput: output
                        });
                    }
                }
            });
            
            stream.on('data', (data) => {
                output += data.toString();
            });
            
            stream.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
        });
    });
    
    conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!responseHandled) {
            responseHandled = true;
            res.json({ success: false, error: `SSH connection failed: ${err.message}` });
        }
    });
    
    conn.connect({
        host: routerConfig.ip,
        username: routerConfig.username,
        password: routerConfig.password,
        port: 22,
        readyTimeout: 10000
    });
});

router.post('/routerboard-firmware', async (req, res) => {
    const { router: routerConfig, action } = req.body;
    
    const conn = new Client();
    let responseHandled = false;
    
    const timeout = setTimeout(() => {
        if (!responseHandled) {
            responseHandled = true;
            conn.end();
            res.json({ success: false, error: 'SSH connection timeout during firmware operation' });
        }
    }, 60000); // Increased to 60 seconds for firmware operations
    
    conn.on('ready', () => {
        if (action === 'check') {
            // Check current and available firmware versions
            const command = '/system/routerboard/print';
            
            conn.exec(command, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    conn.end();
                    if (!responseHandled) {
                        responseHandled = true;
                        return res.json({ success: false, error: err.message });
                    }
                }
                
                let output = '';
                let errorOutput = '';
                
                stream.on('close', (code, signal) => {
                    clearTimeout(timeout);
                    conn.end();
                    if (!responseHandled) {
                        responseHandled = true;
                        
                        if (code !== 0 && errorOutput) {
                            res.json({ success: false, error: errorOutput });
                        } else {
                            res.json({ 
                                success: true, 
                                output: output,
                                action: action
                            });
                        }
                    }
                });
                
                stream.on('data', (data) => {
                    output += data.toString();
                });
                
                stream.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
            });
        } else if (action === 'upgrade') {
            // Use a combined command to create and run the firmware upgrade script
            const scriptName = 'firmware-updater';
            const combinedCommand = `/system/script/remove [find name="${scriptName}"]; /system/script/add name="${scriptName}" source="/system/routerboard/upgrade" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon; /system/script/run ${scriptName}; /system/script/remove ${scriptName}`;
            
            conn.exec(combinedCommand, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    conn.end();
                    if (!responseHandled) {
                        responseHandled = true;
                        return res.json({ success: false, error: err.message });
                    }
                }
                
                let output = '';
                let errorOutput = '';
                
                stream.on('close', (code, signal) => {
                    clearTimeout(timeout);
                    conn.end();
                    if (!responseHandled) {
                        responseHandled = true;
                        
                        if (code !== 0 && errorOutput && !errorOutput.includes('no such item')) {
                            res.json({ success: false, error: errorOutput });
                        } else {
                            res.json({ 
                                success: true, 
                                output: 'Firmware upgrade initiated successfully via script',
                                action: action
                            });
                        }
                    }
                });
                
                stream.on('data', (data) => {
                    output += data.toString();
                });
                
                stream.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
            });
        } else {
            // Unknown action
            clearTimeout(timeout);
            conn.end();
            if (!responseHandled) {
                responseHandled = true;
                res.json({ success: false, error: 'Unknown action: ' + action });
            }
        }
    });
    
    conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!responseHandled) {
            responseHandled = true;
            res.json({ success: false, error: `SSH connection failed: ${err.message}` });
        }
    });
    
    conn.connect({
        host: routerConfig.ip,
        username: routerConfig.username,
        password: routerConfig.password,
        port: 22,
        readyTimeout: 10000
    });
});

router.post('/queue-search', async (req, res) => {
    const { router: routerConfig, searchValue, searchType } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: 8728,
            timeout: 10000
        });
        
        await api.connect();
        
        let foundEntries = [];
        
        // Search in DHCP leases first
        const dhcpLeases = await api.write('/ip/dhcp-server/lease/print');
        const dhcpMatches = dhcpLeases.filter(lease => {
            if (searchType === 'auto') {
                return (
                    (lease.address && lease.address.includes(searchValue)) ||
                    (lease['mac-address'] && lease['mac-address'].toLowerCase().includes(searchValue.toLowerCase())) ||
                    (lease['host-name'] && lease['host-name'].toLowerCase().includes(searchValue.toLowerCase())) ||
                    (lease['client-id'] && lease['client-id'].toLowerCase().includes(searchValue.toLowerCase())) ||
                    (lease.comment && lease.comment.toLowerCase().includes(searchValue.toLowerCase()))
                );
            }
            return false;
        });
        
        // Skip ARP entries for now
        
        // Search in queues
        const queues = await api.write('/queue/simple/print');
        
        // First, find queues that directly match the search term
        const directQueueMatches = queues.filter(queue => {
            if (searchType === 'auto') {
                return (
                    (queue.target && queue.target.includes(searchValue)) ||
                    (queue.name && queue.name.toLowerCase().includes(searchValue.toLowerCase())) ||
                    (queue.comment && queue.comment.toLowerCase().includes(searchValue.toLowerCase()))
                );
            }
            return false;
        });
        
        // Then, find queues for any IP addresses found in DHCP results
        const dhcpIPs = dhcpMatches.map(lease => lease.address);
        const relatedQueueMatches = queues.filter(queue => {
            if (dhcpIPs.length > 0 && queue.target) {
                // Check if queue target matches any DHCP IP (with or without /32)
                const queueIP = queue.target.replace('/32', '');
                return dhcpIPs.includes(queueIP);
            }
            return false;
        });
        
        // Combine and deduplicate queue matches
        const allQueueMatches = [...directQueueMatches];
        relatedQueueMatches.forEach(queue => {
            if (!allQueueMatches.find(existing => existing['.id'] === queue['.id'])) {
                allQueueMatches.push(queue);
            }
        });
        
        const queueMatches = allQueueMatches;
        
        await api.close();
        
        res.json({
            success: true,
            data: {
                dhcp: dhcpMatches,
                arp: [], // No ARP entries
                queues: queueMatches,
                searchValue: searchValue
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/queue-modify', async (req, res) => {
    const { router: routerConfig, action, queueData } = req.body;
    
    
    // For other operations, use API
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: 8728,
            timeout: 10000
        });
        
        await api.connect();
        
        if (action === 'update') {
            // First ensure CAKE queue type exists
            await ensureCakeQueueTypeExists(routerConfig);
            
            // Update existing queue by removing and recreating
            const conn = new Client();
            let responseHandled = false;
            
            const timeout = setTimeout(() => {
                if (!responseHandled) {
                    responseHandled = true;
                    conn.end();
                    res.json({ success: false, error: 'SSH connection timeout during queue update' });
                }
            }, 15000);
            
            conn.on('ready', () => {
                const targetIP = queueData.target.includes('/') ? queueData.target : `${queueData.target}/32`;
                
                // First remove existing queue, then create new one
                const removeCommand = `:foreach i in=[/queue/simple/find where target="${targetIP}"] do={/queue/simple/remove $i}`;
                const createCommand = `/queue/simple/add name="${queueData.target}" target="${queueData.target}" queue="CAKE/CAKE" max-limit="${queueData.maxUpload}/${queueData.maxDownload}" comment="${queueData.comment || 'ADDED-THROUGH-GUARDIAN.RELAY -- '}"`;
                const combinedCommand = `${removeCommand}; ${createCommand}`;
                
                console.log('Updating queue via remove-and-recreate with command:', combinedCommand);
                
                conn.exec(combinedCommand, (err, stream) => {
                    if (err) {
                        clearTimeout(timeout);
                        conn.end();
                        if (!responseHandled) {
                            responseHandled = true;
                            return res.json({ success: false, error: err.message });
                        }
                    }
                    
                    let output = '';
                    let errorOutput = '';
                    
                    stream.on('close', (code, signal) => {
                        clearTimeout(timeout);
                        conn.end();
                        if (!responseHandled) {
                            responseHandled = true;
                            
                            if (code !== 0 && errorOutput) {
                                res.json({ success: false, error: errorOutput });
                            } else {
                                res.json({ success: true, message: 'CAKE queue updated successfully via remove-and-recreate' });
                            }
                        }
                    });
                    
                    stream.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    stream.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });
                });
            });
            
            conn.on('error', (err) => {
                clearTimeout(timeout);
                if (!responseHandled) {
                    responseHandled = true;
                    res.json({ success: false, error: `SSH connection failed: ${err.message}` });
                }
            });
            
            conn.connect({
                host: routerConfig.ip,
                username: routerConfig.username,
                password: routerConfig.password,
                port: 22,
                readyTimeout: 10000
            });
            
            return;
        } else if (action === 'remove') {
            if (queueData.target) {
                // Remove queue using SSH
                const conn = new Client();
                let responseHandled = false;
                
                const timeout = setTimeout(() => {
                    if (!responseHandled) {
                        responseHandled = true;
                        conn.end();
                        res.json({ success: false, error: 'SSH connection timeout during queue removal' });
                    }
                }, 15000);
                
                conn.on('ready', () => {
                    const targetIP = queueData.target.includes('/') ? queueData.target : `${queueData.target}/32`;
                    const command = `:foreach i in=[/queue/simple/find where target="${targetIP}"] do={/queue/simple/remove $i}`;
                    
                    console.log('Removing queue via SSH with command:', command);
                    
                    conn.exec(command, (err, stream) => {
                        if (err) {
                            clearTimeout(timeout);
                            conn.end();
                            if (!responseHandled) {
                                responseHandled = true;
                                return res.json({ success: false, error: err.message });
                            }
                        }
                        
                        let output = '';
                        let errorOutput = '';
                        
                        stream.on('close', (code, signal) => {
                            clearTimeout(timeout);
                            conn.end();
                            if (!responseHandled) {
                                responseHandled = true;
                                
                                if (code !== 0 && errorOutput) {
                                    res.json({ success: false, error: errorOutput });
                                } else {
                                    res.json({ success: true, message: 'Queue removed successfully via SSH' });
                                }
                            }
                        });
                        
                        stream.on('data', (data) => {
                            output += data.toString();
                        });
                        
                        stream.stderr.on('data', (data) => {
                            errorOutput += data.toString();
                        });
                    });
                });
                
                conn.on('error', (err) => {
                    clearTimeout(timeout);
                    if (!responseHandled) {
                        responseHandled = true;
                        res.json({ success: false, error: `SSH connection failed: ${err.message}` });
                    }
                });
                
                conn.connect({
                    host: routerConfig.ip,
                    username: routerConfig.username,
                    password: routerConfig.password,
                    port: 22,
                    readyTimeout: 10000
                });
                
                return;
            } else {
                res.json({ success: false, error: 'No target IP provided' });
            }
        }
        
        await api.close();
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/traffic-data', async (req, res) => {
    const { router: routerConfig, interface: interfaceName } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: 8728,
            timeout: 5000
        });
        
        await api.connect();
        
        // Get interface statistics
        const interfaces = await api.write('/interface/print', { '.proplist': 'name,rx-byte,tx-byte' });
        const targetInterface = interfaces.find(i => i.name === interfaceName);
        
        if (!targetInterface) {
            await api.close();
            return res.json({ success: false, error: 'Interface not found' });
        }
        
        // Store initial values if not set
        if (!global.interfaceStats) {
            global.interfaceStats = {};
        }
        
        const now = Date.now();
        const interfaceKey = `${routerConfig.ip}_${interfaceName}`;
        
        if (global.interfaceStats[interfaceKey]) {
            // Calculate rate based on difference
            const timeDiff = (now - global.interfaceStats[interfaceKey].timestamp) / 1000; // seconds
            const rxDiff = parseInt(targetInterface['rx-byte']) - global.interfaceStats[interfaceKey].rxBytes;
            const txDiff = parseInt(targetInterface['tx-byte']) - global.interfaceStats[interfaceKey].txBytes;
            
            const rxRate = (rxDiff * 8) / timeDiff; // bits per second
            const txRate = (txDiff * 8) / timeDiff; // bits per second
            
            // Update stored values
            global.interfaceStats[interfaceKey] = {
                rxBytes: parseInt(targetInterface['rx-byte']),
                txBytes: parseInt(targetInterface['tx-byte']),
                timestamp: now
            };
            
            await api.close();
            
            res.json({
                success: true,
                data: {
                    rxRate: Math.max(0, rxRate), // Download rate in bps
                    txRate: Math.max(0, txRate), // Upload rate in bps
                    interface: interfaceName
                }
            });
        } else {
            // First time - store values and return 0
            global.interfaceStats[interfaceKey] = {
                rxBytes: parseInt(targetInterface['rx-byte']),
                txBytes: parseInt(targetInterface['tx-byte']),
                timestamp: now
            };
            
            await api.close();
            
            res.json({
                success: true,
                data: {
                    rxRate: 0,
                    txRate: 0,
                    interface: interfaceName
                }
            });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;