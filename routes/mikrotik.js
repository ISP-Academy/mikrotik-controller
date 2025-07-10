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
            port: parseInt(routerConfig.sshPort || '22'),
            readyTimeout: 8000
        });
    });
}

router.post('/connect', async (req, res) => {
    const { ip, username, password, sshPort = '22', apiPort = '8728' } = req.body;
    
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - API may not be enabled')), 8000);
    });
    
    try {
        const api = new RouterOSAPI({
            host: ip,
            user: username,
            password: password,
            port: parseInt(apiPort),
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
            systemInfo: systemInfo,
            deviceName: identity[0]?.name || 'Unknown Device'
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
            port: parseInt(routerConfig.apiPort || '8728'),
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
            case 'routes':
                data = await api.write('/ip/route/print');
                break;
            case 'vlans':
                data = await api.write('/interface/bridge/vlan/print');
                break;
            case 'bridge-ports':
                data = await api.write('/interface/bridge/port/print');
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
            case 'system-clock':
                data = await api.write('/system/clock/print');
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
        port: parseInt(routerConfig.sshPort || '22'),
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
        port: parseInt(routerConfig.sshPort || '22'),
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
        port: parseInt(routerConfig.sshPort || '22'),
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
        port: parseInt(routerConfig.sshPort || '22'),
        readyTimeout: 10000
    });
});

router.post('/blocked-customers', async (req, res) => {
    const { router: routerConfig } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: parseInt(routerConfig.apiPort || '8728'),
            timeout: 10000
        });
        
        await api.connect();
        
        // Get BLOCKED-CUSTOMERS address list
        const addressList = await api.write('/ip/firewall/address-list/print', {
            '?list': 'BLOCKED-CUSTOMERS'
        });
        
        await api.close();
        
        res.json({
            success: true,
            data: {
                addresses: addressList.map(addr => addr.address)
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/block-customer', async (req, res) => {
    const { router: routerConfig, action, ipAddress } = req.body;
    
    try {
        const ssh = new Client();
        
        await new Promise((resolve, reject) => {
            ssh.connect({
                host: routerConfig.ip,
                username: routerConfig.username,
                password: routerConfig.password,
                port: parseInt(routerConfig.sshPort || '22'),
                readyTimeout: 10000
            });
            
            ssh.on('ready', () => {
                if (action === 'block') {
                    // First get router time, then add IP to BLOCKED-CUSTOMERS list
                    ssh.exec('/system/clock/print', (err, timeStream) => {
                        if (err) {
                            ssh.end();
                            reject(err);
                            return;
                        }
                        
                        let timeOutput = '';
                        timeStream.on('data', (data) => {
                            timeOutput += data.toString();
                        });
                        
                        timeStream.on('close', () => {
                            // Extract time and date from router output
                            const timeMatch = timeOutput.match(/time:\s*([^\r\n]+)/);
                            const dateMatch = timeOutput.match(/date:\s*([^\r\n]+)/);
                            
                            let routerTime = 'unknown time';
                            if (timeMatch && dateMatch) {
                                routerTime = `${dateMatch[1]} ${timeMatch[1]}`;
                            }
                            
                            // Now add the IP with router time
                            const addCommand = `/ip/firewall/address-list/add list=BLOCKED-CUSTOMERS address=${ipAddress} comment="Blocked via Guardian Relay - ${routerTime}"`;
                            
                            ssh.exec(addCommand, (err, stream) => {
                                if (err) {
                                    ssh.end();
                                    reject(err);
                                    return;
                                }
                                
                                let output = '';
                                let error = '';
                                
                                stream.on('close', () => {
                                    ssh.end();
                                    if (error) {
                                        reject(new Error(error));
                                    } else {
                                        resolve(output);
                                    }
                                });
                                
                                stream.on('data', (data) => {
                                    output += data.toString();
                                });
                                
                                stream.stderr.on('data', (data) => {
                                    error += data.toString();
                                });
                            });
                        });
                    });
                } else if (action === 'unblock') {
                    // Remove IP from BLOCKED-CUSTOMERS list
                    const command = `:foreach i in=[/ip/firewall/address-list/find where list="BLOCKED-CUSTOMERS" and address="${ipAddress}"] do={/ip/firewall/address-list/remove $i}`;
                    
                    ssh.exec(command, (err, stream) => {
                        if (err) {
                            ssh.end();
                            reject(err);
                            return;
                        }
                        
                        let output = '';
                        let error = '';
                        
                        stream.on('close', () => {
                            ssh.end();
                            if (error) {
                                reject(new Error(error));
                            } else {
                                resolve(output);
                            }
                        });
                        
                        stream.on('data', (data) => {
                            output += data.toString();
                        });
                        
                        stream.stderr.on('data', (data) => {
                            error += data.toString();
                        });
                    });
                }
            });
            
            ssh.on('error', (err) => {
                reject(err);
            });
        });
        
        res.json({
            success: true,
            message: `IP ${ipAddress} has been ${action}ed successfully`
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/all-queues', async (req, res) => {
    const { router: routerConfig } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: parseInt(routerConfig.apiPort || '8728'),
            timeout: 10000
        });
        
        await api.connect();
        
        // Get all queues
        const queues = await api.write('/queue/simple/print');
        
        await api.close();
        
        res.json({
            success: true,
            data: {
                queues: queues,
                total: queues.length
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

router.post('/queue-search', async (req, res) => {
    const { router: routerConfig, searchValue, searchType } = req.body;
    
    try {
        const api = new RouterOSAPI({
            host: routerConfig.ip,
            user: routerConfig.username,
            password: routerConfig.password,
            port: parseInt(routerConfig.apiPort || '8728'),
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
            port: parseInt(routerConfig.apiPort || '8728'),
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
                
                // Build the create command with optional burst parameters
                let createCommand = `/queue/simple/add name="${queueData.target}" target="${queueData.target}" queue="CAKE/CAKE" max-limit="${queueData.maxUpload}/${queueData.maxDownload}"`;
                
                console.log('Queue data received:', JSON.stringify(queueData));
                
                // Add burst parameters if provided
                if (queueData.burstUpload && queueData.burstDownload) {
                    console.log('Adding burst-limit:', queueData.burstUpload, '/', queueData.burstDownload);
                    createCommand += ` burst-limit="${queueData.burstUpload}/${queueData.burstDownload}"`;
                }
                if (queueData.burstThresholdUpload && queueData.burstThresholdDownload) {
                    console.log('Adding burst-threshold:', queueData.burstThresholdUpload, '/', queueData.burstThresholdDownload);
                    createCommand += ` burst-threshold="${queueData.burstThresholdUpload}/${queueData.burstThresholdDownload}"`;
                }
                if (queueData.burstTimeUpload && queueData.burstTimeDownload) {
                    console.log('Adding burst-time:', queueData.burstTimeUpload, '/', queueData.burstTimeDownload);
                    createCommand += ` burst-time="${queueData.burstTimeUpload}/${queueData.burstTimeDownload}"`;
                }
                
                createCommand += ` comment="${queueData.comment || 'ADDED-THROUGH-GUARDIAN.RELAY -- '}"`;
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
                port: parseInt(routerConfig.sshPort || '22'),
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
                    port: parseInt(routerConfig.sshPort || '22'),
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
            port: parseInt(routerConfig.apiPort || '8728'),
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

// RoMON Discovery endpoint for Network Topology
router.post('/romon-discover', async (req, res) => {
    console.log('RoMON Discovery endpoint hit:', req.body);
    const routerConfig = req.body;
    
    // Validate required fields
    console.log('Validating parameters - ip:', !!routerConfig.ip, 'username:', !!routerConfig.username, 'password:', !!routerConfig.password);
    if (!routerConfig.ip || !routerConfig.username || !routerConfig.password) {
        console.log('Validation failed - missing required parameters');
        return res.json({ 
            success: false, 
            error: 'Missing required connection parameters (ip, username, password)' 
        });
    }
    console.log('Validation passed, proceeding with RoMON discovery');
    
    try {
        console.log('Starting RoMON discovery process...');
        console.log('Creating SSH client...');
        const conn = new Client();
        console.log('SSH client created successfully');
        let output = '';
        let errorOutput = '';
        
        const connectionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('RoMON discovery timeout reached, ending connection');
                conn.end();
                reject(new Error('RoMON discovery timeout - taking too long'));
            }, 20000); // Longer timeout for large networks
            
            conn.on('ready', () => {
                console.log('SSH connection established for RoMON discovery');
                
                // Use RoMON with proplist to get identity names
                const command = '/tool/romon/discover proplist=cost,identity,address,path';
                console.log('Executing RoMON command:', command);
                
                // Track devices as we receive them to avoid overload
                const deviceMap = new Map(); // Use MAC as key to deduplicate
                let dataProcessingComplete = false;
                
                // Set a command-specific timeout - increased to allow more devices
                const commandTimeout = setTimeout(() => {
                    console.log('RoMON command timeout - forcing completion');
                    if (!dataProcessingComplete) {
                        dataProcessingComplete = true;
                        clearTimeout(timeout);
                        conn.end();
                        const devices = Array.from(deviceMap.values());
                        console.log('Timeout - collected', devices.length, 'unique devices');
                        resolve({ devices });
                    }
                }, 10000); // 10 second timeout to gather all data
                
                conn.exec(command, (err, stream) => {
                    if (err) {
                        clearTimeout(commandTimeout);
                        clearTimeout(timeout);
                        reject(err);
                        return;
                    }
                    
                    stream.on('close', (code, signal) => {
                        if (!dataProcessingComplete) {
                            dataProcessingComplete = true;
                            clearTimeout(commandTimeout);
                            clearTimeout(timeout);
                            conn.end();
                            
                            console.log('RoMON command completed with code:', code);
                            
                            // Use devices collected incrementally
                            const devices = Array.from(deviceMap.values());
                            console.log('Final device count:', devices.length);
                            console.log('Collected devices:', devices.map(d => ({ name: d.identity, mac: d.mac, cost: d.cost })));
                            resolve({ devices });
                        }
                    });
                    
                    stream.on('data', (data) => {
                        output += data.toString();
                        console.log('Received RoMON data chunk, total length now:', output.length);
                        
                        // Log raw output for debugging path parsing
                        if (output.length < 2000) {
                            console.log('Raw RoMON output so far:\n', output);
                        }
                        
                        // Process only complete lines to avoid partial parsing
                        const lines = output.split('\n');
                        const completeOutput = lines.slice(0, -1).join('\n'); // Exclude last partial line
                        
                        const newDevices = parseRomonOutput(completeOutput);
                        newDevices.forEach(device => {
                            if (device.mac && !deviceMap.has(device.mac)) {
                                deviceMap.set(device.mac, device);
                                console.log('Added device:', device.identity || device.mac, 'cost:', device.cost);
                                if (device.path && device.path.length > 0) {
                                    console.log('  -> Path:', device.path.join(' → '));
                                }
                            }
                        });
                        
                        // Log progress
                        console.log('Current device count:', deviceMap.size);
                        
                        // Stop collecting if we have enough devices (prevent overload)
                        if (deviceMap.size >= 100 && !dataProcessingComplete) {
                            console.log('Collected enough devices (100+), stopping RoMON discovery');
                            dataProcessingComplete = true;
                            clearTimeout(commandTimeout);
                            clearTimeout(timeout);
                            conn.end();
                            const devices = Array.from(deviceMap.values());
                            resolve({ devices });
                        }
                    });
                    
                    stream.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                        console.log('RoMON stderr:', data.toString());
                    });
                });
            });
            
            conn.on('error', (err) => {
                clearTimeout(timeout);
                console.log('SSH connection error:', err.message);
                reject(err);
            });
        });
        
        console.log('Attempting SSH connection for RoMON to:', routerConfig.ip, 'port:', routerConfig.sshPort || routerConfig.port || '22');
        conn.connect({
            host: routerConfig.ip,
            username: routerConfig.username,
            password: routerConfig.password,
            port: parseInt(routerConfig.sshPort || routerConfig.port || '22'),
            readyTimeout: 10000
        });
        
        const topology = await connectionPromise;
        
        // Also try to get additional device info via API if possible
        try {
            const api = new RouterOSAPI({
                host: routerConfig.ip,
                user: routerConfig.username,
                password: routerConfig.password,
                port: parseInt(routerConfig.apiPort || '8728'),
                timeout: 5000
            });
            
            await api.connect();
            
            // Get neighbor information (LLDP/CDP) to map MAC addresses to device names
            const neighbors = await api.write('/ip/neighbor/print');
            console.log('Found', neighbors.length, 'neighbors from API');
            
            // Create a MAC to name mapping from neighbors
            const macToName = {};
            neighbors.forEach(neighbor => {
                const mac = neighbor['mac-address'] || neighbor.mac;
                const identity = neighbor.identity || neighbor.system || neighbor['system-name'];
                if (mac && identity) {
                    macToName[mac.toUpperCase()] = identity;
                    console.log('Mapped MAC', mac, 'to', identity);
                }
            });
            
            // Enhance topology devices with names from neighbor info
            if (topology.devices && topology.devices.length > 0) {
                topology.devices.forEach(device => {
                    const upperMac = device.address.toUpperCase();
                    if (macToName[upperMac]) {
                        device.identity = macToName[upperMac];
                        device.name = macToName[upperMac];
                        console.log('Enhanced device', device.address, 'with name', device.name);
                    }
                });
            }
            
            // Get interface information
            const interfaces = await api.write('/interface/print', { 
                '.proplist': 'name,type,mac-address,comment' 
            });
            
            // Try to get routing table for distance estimation
            let routes = [];
            try {
                routes = await api.write('/ip/route/print', {
                    '.proplist': 'dst-address,gateway,distance,scope'
                });
            } catch (routeError) {
                console.log('Could not get routing table:', routeError.message);
            }
            
            // If RoMON didn't find devices, use neighbors as fallback
            console.log('RoMON devices found:', topology.devices ? topology.devices.length : 0);
            if (!topology.devices || topology.devices.length === 0) {
                console.log('Using neighbor discovery fallback, found neighbors:', neighbors.length);
                
                // Function to estimate cost based on various factors
                function estimateCost(neighbor, index) {
                    // Try to determine cost based on interface type and device properties
                    let estimatedCost = 100; // Base cost (1 hop)
                    
                    // Check if this is a direct neighbor vs multi-hop based on interface
                    const interfaceName = neighbor.interface || '';
                    const deviceIP = neighbor.address || neighbor['address4'] || '';
                    
                    // Look for routing entries that might indicate distance
                    if (deviceIP && routes.length > 0) {
                        const relatedRoute = routes.find(route => 
                            route.gateway === deviceIP || 
                            route['dst-address']?.includes(deviceIP.split('.').slice(0, 3).join('.'))
                        );
                        
                        if (relatedRoute && relatedRoute.distance) {
                            // Use routing distance as a cost indicator
                            estimatedCost = parseInt(relatedRoute.distance) * 100;
                        }
                    }
                    
                    // Estimate based on interface type
                    if (interfaceName.includes('vlan') || interfaceName.includes('bridge')) {
                        estimatedCost = 100; // Direct connection through VLAN/bridge
                    } else if (interfaceName.includes('tunnel') || interfaceName.includes('vpn')) {
                        estimatedCost = 300; // Tunnel connections are typically multi-hop
                    } else if (interfaceName.includes('wireless') || interfaceName.includes('wlan')) {
                        estimatedCost = 200; // Wireless might be one hop away
                    }
                    
                    // Add some variation based on position to simulate network topology
                    // This creates a more realistic tree structure
                    if (index < 5) {
                        estimatedCost = 100; // First 5 are direct neighbors
                    } else if (index < 15) {
                        estimatedCost = 200; // Next 10 are one hop away
                    } else if (index < 25) {
                        estimatedCost = 300; // Next 10 are two hops away
                    } else {
                        estimatedCost = 400; // Rest are three hops away
                    }
                    
                    return estimatedCost;
                }
                
                topology.devices = neighbors.map((neighbor, index) => ({
                    mac: neighbor['mac-address'],
                    identity: neighbor.identity || neighbor['system-name'] || 'Unknown',
                    ip: neighbor.address || neighbor['address4'] || '',
                    interface: neighbor.interface,
                    platform: neighbor.platform || neighbor['system-description'] || '',
                    type: detectDeviceTypeFromNeighbor(neighbor),
                    cost: estimateCost(neighbor, index)
                }));
                
                console.log('Neighbor fallback devices with estimated costs:', topology.devices.map(d => ({ 
                    name: d.identity, 
                    cost: d.cost 
                })));
            } else {
                console.log('Using RoMON devices with costs:', topology.devices.map(d => ({ name: d.identity, cost: d.cost })));
            }
            
            await api.close();
            
            // Merge additional data
            topology.neighbors = neighbors;
            topology.interfaces = interfaces;
            
        } catch (apiError) {
            console.log('API connection failed, using SSH data only:', apiError.message);
        }
        
        res.json({ success: true, topology });
        
    } catch (error) {
        console.error('RoMON discovery error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Helper function to detect device type from neighbor info
function detectDeviceTypeFromNeighbor(neighbor) {
    const platform = (neighbor.platform || neighbor['system-description'] || '').toLowerCase();
    const identity = (neighbor.identity || neighbor['system-name'] || '').toLowerCase();
    
    if (platform.includes('routeros') || platform.includes('mikrotik')) {
        if (platform.includes('switch') || identity.includes('switch')) return 'switch';
        if (platform.includes('cap') || identity.includes('cap') || identity.includes('ap')) return 'ap';
        return 'router';
    }
    
    if (platform.includes('switch') || identity.includes('switch')) return 'switch';
    if (platform.includes('ap') || identity.includes('ap')) return 'ap';
    
    return 'unknown';
}

// Helper function to parse RoMON output 
function parseRomonOutput(output) {
    const devices = [];
    const lines = output.split('\n');
    
    console.log('Parsing RoMON output, total lines:', lines.length);
    
    // Parse RoMON output with identity
    // Format: A COST IDENTITY ADDRESS PATH
    // Path spans multiple lines with MAC addresses
    let isDataSection = false;
    let deviceCount = 0;
    let i = 0;
    
    while (i < lines.length) {
        const trimmedLine = lines[i].trim();
        
        // Skip header lines and empty lines
        if (trimmedLine.startsWith('Flags:') || trimmedLine.includes('COST') || trimmedLine === '') {
            if (trimmedLine.includes('COST') && trimmedLine.includes('IDENTITY')) {
                isDataSection = true;
                console.log('Found COST/IDENTITY header at line', i, '- data section starts');
            }
            i++;
            continue;
        }
        
        // Process data lines starting with flag 'A' (Active devices)
        if (isDataSection && trimmedLine.startsWith('A ')) {
            // Parse the main device line
            // Format: A COST IDENTITY ADDRESS PATH
            // Split only the first few fields, identity might have spaces
            const match = trimmedLine.match(/^A\s+(\d+)\s+(.+?)\s+([0-9A-Fa-f:]+)\s*(.*)/);
            
            if (match) {
                const device = {};
                
                // Parse the main fields
                device.cost = parseInt(match[1]) || 100;
                device.identity = match[2].trim();
                device.address = match[3];
                device.hops = Math.ceil(device.cost / 200); // Calculate hops from cost
                device.path = [];
                
                // Parse remaining part for path MAC addresses
                const pathPart = match[4];
                if (pathPart) {
                    const pathParts = pathPart.split(/\s+/);
                    pathParts.forEach(part => {
                        if (isMacAddress(part)) {
                            device.path.push(part);
                        }
                    });
                }
                
                // Check following lines for additional path information
                let nextLineIndex = i + 1;
                
                while (nextLineIndex < lines.length) {
                    const nextLine = lines[nextLineIndex].trim();
                    
                    // Stop if we hit another device line or header
                    if (nextLine.startsWith('A ') || nextLine === '' || 
                        nextLine.startsWith('Flags:') || nextLine.includes('COST')) {
                        break;
                    }
                    
                    // Parse MAC addresses from continuation lines
                    const nextParts = nextLine.split(/\s+/);
                    
                    nextParts.forEach(part => {
                        if (isMacAddress(part)) {
                            if (!device.path.includes(part)) {
                                device.path.push(part);
                            }
                        }
                    });
                    
                    nextLineIndex++;
                }
                
                // Set device properties
                device.mac = device.address;
                device.name = device.identity;
                
                deviceCount++;
                if (deviceCount <= 10) { // Only log first 10 to avoid spam
                    console.log('Parsed RoMON device #' + deviceCount + ':', {
                        identity: device.identity,
                        address: device.address,
                        cost: device.cost,
                        hops: device.hops,
                        pathLength: device.path.length,
                        path: device.path
                    });
                }
                
                devices.push(device);
                
                // Skip to the line after the path information
                i = nextLineIndex - 1;
            } else {
                console.log('Skipping malformed device line:', trimmedLine);
            }
        }
        
        i++;
    }
    
    console.log('Total devices parsed this round:', devices.length);
    return devices;
}

// Helper function to check if a string is a MAC address
function isMacAddress(str) {
    // Match MAC address format like 04:CE:14:F7:B8:D6
    return /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/.test(str);
}

module.exports = router;