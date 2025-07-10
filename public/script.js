let currentRouter = null;
let refreshInterval = null;
const RECENT_ROUTERS_KEY = 'mikrotik-recent-routers';
const MAX_RECENT_ROUTERS = 5;

// Helper function to format max-limit values from bits to readable format
function formatMaxLimit(maxLimit) {
    if (!maxLimit || maxLimit === '-') return '-';
    
    // Split upload/download values
    const limits = maxLimit.split('/');
    const upload = limits[0] || '';
    const download = limits[1] || '';
    
    function convertToReadable(value) {
        if (!value) return '';
        
        // Remove any existing unit suffix
        const numericValue = value.replace(/[MKG]$/i, '');
        
        // If it's a large number (likely in bits), convert to Mbps
        if (/^\d+$/.test(numericValue) && parseInt(numericValue) >= 1000000) {
            return Math.round(parseInt(numericValue) / 1000000) + 'M';
        }
        
        // If it already has a unit, keep it
        if (/[MKG]$/i.test(value)) {
            return value;
        }
        
        // If it's a reasonable number, add M suffix
        return value + 'M';
    }
    
    const uploadFormatted = convertToReadable(upload);
    const downloadFormatted = convertToReadable(download);
    
    return `${uploadFormatted}/${downloadFormatted}`;
}

document.getElementById('connectBtn').addEventListener('click', connectToRouter);
document.getElementById('autoRefreshToggle').addEventListener('change', toggleAutoRefresh);
document.getElementById('recentSelect').addEventListener('change', selectRecentRouter);

// Clear data when router credentials change
['routerIP', 'username', 'password', 'sshPort', 'apiPort'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        // Only clear if we're currently connected to a router
        if (currentRouter && currentRouter.ip) {
            // Check if any credential has changed
            const newIP = document.getElementById('routerIP').value.trim();
            const newUsername = document.getElementById('username').value.trim();
            const newPassword = document.getElementById('password').value.trim();
            const newSSHPort = document.getElementById('sshPort').value.trim() || '22';
            const newAPIPort = document.getElementById('apiPort').value.trim() || '8728';
            
            if (newIP !== currentRouter.ip || 
                newUsername !== currentRouter.username || 
                newPassword !== currentRouter.password ||
                newSSHPort !== currentRouter.sshPort ||
                newAPIPort !== currentRouter.apiPort) {
                clearAllRouterData();
                currentRouter = null;
                showStatus('Router connection details changed - please connect again', 'info');
            }
        }
    });
});

// Add Enter key support for queue search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchValue');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchForRouter();
            }
        });
    }
    
    // Add Enter key support for router connection fields
    ['routerIP', 'username', 'password', 'sshPort', 'apiPort'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    connectToRouter();
                }
            });
        }
    });
});

// Initialize recent routers on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRecentRouters();
});

function clearAllRouterData() {
    // Stop any auto-refresh
    stopSystemInfoRefresh();
    
    // Clear system info display
    document.getElementById('deviceName').textContent = '-';
    document.getElementById('routerOSVersion').textContent = '-';
    document.getElementById('deviceModel').textContent = '-';
    document.getElementById('deviceUptime').textContent = '-';
    document.getElementById('cpuUsage').textContent = '-';
    document.getElementById('memoryUsage').textContent = '-';
    document.getElementById('platform').textContent = '-';
    document.getElementById('serialNumber').textContent = '-';
    document.getElementById('cpuFill').style.width = '0%';
    document.getElementById('memoryFill').style.width = '0%';
    
    // Clear output area
    document.getElementById('outputArea').textContent = '';
    
    // Hide and clear all panels
    document.getElementById('resultsDisplay').style.display = 'none';
    document.getElementById('resultsContent').innerHTML = '';
    document.getElementById('updatePanel').style.display = 'none';
    document.getElementById('updateInfo').innerHTML = '';
    document.getElementById('updateActions').innerHTML = '';
    document.getElementById('firmwarePanel').style.display = 'none';
    document.getElementById('firmwareInfo').innerHTML = '';
    document.getElementById('firmwareActions').innerHTML = '';
    document.getElementById('queuePanel').style.display = 'none';
    document.getElementById('queueResults').style.display = 'none';
    document.getElementById('queueResults').innerHTML = '';
    document.getElementById('queueModify').style.display = 'none';
    
    // Clear queue search
    document.getElementById('searchValue').value = '';
    document.getElementById('maxUpload').value = '';
    document.getElementById('maxDownload').value = '';
    document.getElementById('queueComment').value = '';
    
    // Reset any selected targets
    selectedTarget = null;
    currentSearchResults = null;
    
    // Hide system info and controls until connected
    document.getElementById('systemInfoTile').style.display = 'none';
    document.getElementById('deviceTypeSection').style.display = 'none';
    document.getElementById('routerControls').style.display = 'none';
    document.getElementById('switchControls').style.display = 'none';
    document.getElementById('wirelessControls').style.display = 'none';
    document.getElementById('trafficSection').style.display = 'none';
    
    // Traffic monitoring will stop automatically with auto-refresh
    
    // Clear traffic data
    window.currentWANInterface = null;
    document.getElementById('interfaceSelect').innerHTML = '<option value="">Auto-detect</option>';
    document.querySelector('.speed-up').textContent = '↑ 0 Mbps';
    document.querySelector('.speed-down').textContent = '↓ 0 Mbps';
    trafficData = { labels: [], upload: [], download: [] };
    if (trafficChart) {
        trafficChart.ctx.clearRect(0, 0, trafficChart.width, trafficChart.height);
    }
}

function loadRecentRouters() {
    const recentRouters = getRecentRouters();
    const recentSelect = document.getElementById('recentSelect');
    const recentRoutersDiv = document.getElementById('recentRouters');
    
    // Clear existing options except the first one
    recentSelect.innerHTML = '<option value="">Select a recent device...</option>';
    
    if (recentRouters.length > 0) {
        recentRouters.forEach(router => {
            const option = document.createElement('option');
            option.value = router.ip;
            option.textContent = `${router.ip} (${router.name || 'Unknown'})`;
            recentSelect.appendChild(option);
        });
        recentRoutersDiv.style.display = 'block';
    } else {
        recentRoutersDiv.style.display = 'none';
    }
}

function getRecentRouters() {
    const stored = localStorage.getItem(RECENT_ROUTERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function addRecentRouter(ip, name, sshPort = '22', apiPort = '8728') {
    let recentRouters = getRecentRouters();
    
    // Remove if already exists
    recentRouters = recentRouters.filter(router => router.ip !== ip);
    
    // Add to beginning
    recentRouters.unshift({ 
        ip, 
        name, 
        sshPort, 
        apiPort, 
        lastUsed: new Date().toISOString() 
    });
    
    // Keep only the last 5
    recentRouters = recentRouters.slice(0, MAX_RECENT_ROUTERS);
    
    // Save to localStorage
    localStorage.setItem(RECENT_ROUTERS_KEY, JSON.stringify(recentRouters));
    
    // Refresh the dropdown
    loadRecentRouters();
}

function selectRecentRouter() {
    const selectedIP = document.getElementById('recentSelect').value;
    if (selectedIP) {
        const recentRouters = getRecentRouters();
        const selectedRouter = recentRouters.find(router => router.ip === selectedIP);
        
        document.getElementById('routerIP').value = selectedIP;
        // Clear username and password for security
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Set port values from stored router data
        if (selectedRouter) {
            document.getElementById('sshPort').value = selectedRouter.sshPort || '22';
            document.getElementById('apiPort').value = selectedRouter.apiPort || '8728';
        } else {
            // Default values if not found
            document.getElementById('sshPort').value = '22';
            document.getElementById('apiPort').value = '8728';
        }
        
        // Focus on username field
        document.getElementById('username').focus();
    }
}

async function connectToRouter() {
    const ip = document.getElementById('routerIP').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const sshPort = document.getElementById('sshPort').value.trim() || '22';
    const apiPort = document.getElementById('apiPort').value.trim() || '8728';
    
    if (!ip || !username || !password) {
        showStatus('Please fill in all fields', 'error');
        return;
    }
    
    // Clear all previous router data before connecting to new router
    clearAllRouterData();
    
    showStatus('Connecting...', 'loading');
    
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ip, username, password, sshPort, apiPort })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentRouter = { ip, username, password, sshPort, apiPort };
            showStatus(`Connected to ${ip} successfully`, 'success');
            document.getElementById('systemInfoTile').style.display = 'block';
            document.getElementById('deviceTypeSection').style.display = 'block';
            document.getElementById('trafficSection').style.display = 'block';
            
            // Initialize traffic monitoring
            initializeTrafficMonitor();
            
            // Display system info automatically
            if (result.systemInfo) {
                populateSystemInfo(result.systemInfo);
                
                // Add to recent routers with device name
                const deviceName = result.systemInfo.identity?.name || ip;
                addRecentRouter(ip, deviceName, sshPort, apiPort);
            }
            
            // Start auto-refresh for system info if enabled
            if (document.getElementById('autoRefreshToggle').checked) {
                startSystemInfoRefresh();
            }
        } else {
            showStatus(`Connection failed: ${result.error}`, 'error');
            stopSystemInfoRefresh();
        }
    } catch (error) {
        showStatus(`Connection error: ${error.message}`, 'error');
    }
}

async function getData(type) {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput(`Fetching ${type}...`);
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                type: type
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(type, result.data);
            showOutput(`${type.toUpperCase()} DATA:\n` + JSON.stringify(result.data, null, 2));
        } else {
            showOutput(`Error fetching ${type}: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

async function sendCommand(command) {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput(`Executing command: ${command}...`);
    
    try {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                command: command
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput(`COMMAND OUTPUT:\n${result.output}`);
        } else {
            showOutput(`Command failed: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

function populateSystemInfo(systemInfo) {
    // Helper function to safely set element text
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || '-';
        }
    };
    
    // Identity info
    if (systemInfo.identity) {
        setText('deviceName', systemInfo.identity.name);
    }
    
    // Resource info
    if (systemInfo.resource) {
        const res = systemInfo.resource;
        setText('routerOSVersion', res.version);
        setText('platform', res.platform);
        setText('deviceUptime', res.uptime);
        
        // CPU usage with progress bar
        if (res['cpu-load']) {
            const cpuUsage = parseInt(res['cpu-load']);
            const cpuCount = res['cpu-count'] || 'Unknown';
            
            setText('cpuUsage', `${cpuUsage}% (${cpuCount} cores)`);
            
            // Update CPU bar with appropriate color
            const cpuFill = document.getElementById('cpuFill');
            if (cpuFill) {
                cpuFill.style.width = `${cpuUsage}%`;
                
                // Calculate color based on CPU usage percentage
                let color;
                if (cpuUsage <= 50) {
                    // Green zone (0-50%)
                    color = '#27ae60';
                } else if (cpuUsage <= 80) {
                    // Orange zone (50-80%)
                    color = '#f39c12';
                } else {
                    // Red zone (80-100%)
                    color = '#e74c3c';
                }
                
                cpuFill.style.background = color;
            }
        } else {
            setText('cpuUsage', `Unknown (${res['cpu-count'] || 'Unknown'} cores)`);
        }
        
        // Memory usage with progress bar
        if (res['total-memory'] && res['free-memory']) {
            const totalMB = Math.round(res['total-memory'] / 1024 / 1024);
            const freeMB = Math.round(res['free-memory'] / 1024 / 1024);
            const usedMB = totalMB - freeMB;
            const usagePercent = Math.round((usedMB / totalMB) * 100);
            
            setText('memoryUsage', `${usedMB}MB / ${totalMB}MB (${usagePercent}%)`);
            
            // Update memory bar with appropriate color
            const memoryFill = document.getElementById('memoryFill');
            if (memoryFill) {
                memoryFill.style.width = `${usagePercent}%`;
                
                // Calculate color based on usage percentage
                let color;
                if (usagePercent <= 50) {
                    // Green zone (0-50%)
                    color = '#27ae60';
                } else if (usagePercent <= 80) {
                    // Orange zone (50-80%)
                    color = '#f39c12';
                } else {
                    // Red zone (80-100%)
                    color = '#e74c3c';
                }
                
                memoryFill.style.background = color;
            }
        }
    }
    
    // Routerboard info
    if (systemInfo.routerboard) {
        const rb = systemInfo.routerboard;
        setText('deviceModel', rb.model || rb['board-name']);
        setText('serialNumber', rb['serial-number']);
    }
}

function displayResults(type, data) {
    const resultsDisplay = document.getElementById('resultsDisplay');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsDisplay.style.display = 'block';
    
    switch (type) {
        case 'interfaces':
            resultsTitle.textContent = 'Network Interfaces';
            resultsContent.innerHTML = createInterfacesTable(data);
            break;
        case 'dhcp-leases':
            resultsTitle.textContent = 'DHCP Leases';
            resultsContent.innerHTML = createDhcpLeasesTable(data);
            break;
        case 'ip-addresses':
            resultsTitle.textContent = 'IP Addresses';
            resultsContent.innerHTML = createIpAddressesTable(data);
            break;
        case 'routes':
            resultsTitle.textContent = 'Routing Table';
            resultsContent.innerHTML = createRoutesTable(data);
            break;
        case 'vlans':
            resultsTitle.textContent = 'VLAN Viewer';
            resultsContent.innerHTML = createVlansTable(data);
            // Close VLAN configurator if open
            document.getElementById('vlanPanel').style.display = 'none';
            break;
        default:
            resultsTitle.textContent = 'Results';
            resultsContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

function createInterfacesTable(interfaces) {
    let html = '<table class="results-table"><thead><tr>';
    html += '<th>Name</th><th>Type</th><th>Status</th><th>MAC Address</th><th>MTU</th><th>Comment</th>';
    html += '</tr></thead><tbody>';
    
    interfaces.forEach(iface => {
        const status = iface.disabled === 'true' ? 'disabled' : 'enabled';
        const statusClass = status === 'enabled' ? 'status-enabled' : 'status-disabled';
        
        // Check if interface is dynamic
        const isDynamic = iface.dynamic === 'true';
        const dynamicIndicator = isDynamic ? '<span class="dynamic-indicator">D</span>' : '';
        
        html += '<tr>';
        html += `<td><span class="interface-name">${iface.name || '-'}</span>${dynamicIndicator}</td>`;
        html += `<td>${iface.type || '-'}</td>`;
        html += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
        html += `<td>${iface['mac-address'] || '-'}</td>`;
        html += `<td>${iface.mtu || '-'}</td>`;
        html += `<td class="comment-cell">${iface.comment || ''}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function createDhcpLeasesTable(leases) {
    let html = '<table class="results-table"><thead><tr>';
    html += '<th>IP Address</th><th>MAC Address</th><th>Hostname</th><th>Status</th><th>Server</th><th>Comment</th>';
    html += '</tr></thead><tbody>';
    
    leases.forEach(lease => {
        const status = lease.status || 'unknown';
        let statusClass = 'status-waiting';
        if (status === 'bound') statusClass = 'status-bound';
        
        // Check if lease is dynamic
        const isDynamic = lease.dynamic === 'true';
        const dynamicIndicator = isDynamic ? '<span class="dynamic-indicator">D</span>' : '';
        
        html += '<tr>';
        html += `<td><span class="ip-address">${lease.address || '-'}</span>${dynamicIndicator}</td>`;
        html += `<td>${lease['mac-address'] || '-'}</td>`;
        html += `<td>${lease['host-name'] || '-'}</td>`;
        html += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
        html += `<td>${lease.server || '-'}</td>`;
        html += `<td class="comment-cell">${lease.comment || ''}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function createIpAddressesTable(addresses) {
    let html = '<table class="results-table"><thead><tr>';
    html += '<th>Address</th><th>Network</th><th>Interface</th><th>Status</th><th>Comment</th>';
    html += '</tr></thead><tbody>';
    
    addresses.forEach(addr => {
        const status = addr.disabled === 'true' ? 'disabled' : 'enabled';
        const statusClass = status === 'enabled' ? 'status-enabled' : 'status-disabled';
        
        // Check if address is dynamic
        const isDynamic = addr.dynamic === 'true';
        const dynamicIndicator = isDynamic ? '<span class="dynamic-indicator">D</span>' : '';
        
        html += '<tr>';
        html += `<td><span class="ip-address">${addr.address || '-'}</span>${dynamicIndicator}</td>`;
        html += `<td><span class="ip-address">${addr.network || '-'}</span></td>`;
        html += `<td><span class="interface-name">${addr.interface || '-'}</span></td>`;
        html += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
        html += `<td class="comment-cell">${addr.comment || ''}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function createRoutesTable(routes) {
    // Store routes data for sorting
    window.currentRoutesData = routes;
    
    let html = `<div class="table-container">`;
    html += `<table class="results-table routes-sortable"><thead>`;
    
    // Header row with sort toggles
    html += '<tr>';
    html += '<th onclick="sortRoutesTable(0)" style="cursor: pointer;">Destination <span class="sort-arrow" data-column="0">▼</span></th>';
    html += '<th onclick="sortRoutesTable(1)" style="cursor: pointer;">Gateway <span class="sort-arrow" data-column="1">▼</span></th>';
    html += '<th onclick="sortRoutesTable(2)" style="cursor: pointer;">Distance <span class="sort-arrow" data-column="2">▼</span></th>';
    html += '<th>Interface</th><th>Status</th><th>Comment</th>';
    html += '</tr>';
    
    html += '</thead><tbody>';
    
    routes.forEach(route => {
        // Determine if route is active
        const isActive = route.active === 'true';
        const isDisabled = route.disabled === 'true';
        const isDynamic = route.dynamic === 'true';
        
        let status = 'inactive';
        let statusClass = 'status-disabled';
        
        if (!isDisabled && isActive) {
            status = 'active';
            statusClass = 'status-enabled';
        } else if (!isDisabled && !isActive) {
            status = 'inactive';
            statusClass = 'status-waiting';
        } else if (isDisabled) {
            status = 'disabled';
            statusClass = 'status-disabled';
        }
        
        const dynamicIndicator = isDynamic ? '<span class="dynamic-indicator">D</span>' : '';
        
        html += '<tr>';
        html += `<td><span class="ip-address">${route['dst-address'] || '-'}</span>${dynamicIndicator}</td>`;
        html += `<td><span class="ip-address">${route.gateway || '-'}</span></td>`;
        html += `<td>${route.distance || '-'}</td>`;
        html += `<td><span class="interface-name">${route['gateway-status'] ? route['gateway-status'].split(' ')[0] : '-'}</span></td>`;
        html += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
        html += `<td class="comment-cell">${route.comment || ''}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
}

function createVlansTable(vlans) {
    // Store vlans data for sorting
    window.currentVlansData = vlans;
    
    let html = '<div class="table-container">';
    html += '<table class="results-table vlans-sortable"><thead><tr>';
    html += '<th onclick="sortVlansTable(0)" style="cursor: pointer;">VLAN ID <span class="sort-arrow" data-column="0">▼</span></th>';
    html += '<th>Bridge</th><th>Tagged Ports</th><th>Untagged Ports</th><th>Status</th><th>Comment</th><th style="width: 80px;">Actions</th>';
    html += '</tr></thead><tbody>';
    
    vlans.forEach(vlan => {
        const status = vlan.disabled === 'true' ? 'disabled' : 'enabled';
        const statusClass = status === 'enabled' ? 'status-enabled' : 'status-disabled';
        
        // Check if VLAN is dynamic
        const isDynamic = vlan.dynamic === 'true';
        const dynamicIndicator = isDynamic ? '<span class="dynamic-indicator">D</span>' : '';
        
        
        html += '<tr>';
        html += `<td><span class="vlan-id">${vlan['vlan-id'] || vlan['vlan-ids'] || '-'}</span>${dynamicIndicator}</td>`;
        html += `<td><span class="interface-name">${vlan.bridge || '-'}</span></td>`;
        html += `<td><span class="port-list">${vlan.tagged || '-'}</span></td>`;
        html += `<td><span class="port-list">${vlan.untagged || '-'}</span></td>`;
        html += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
        html += `<td class="comment-cell">${vlan.comment || ''}</td>`;
        html += `<td><button class="remove-vlan-btn" onclick="removeVlan('${vlan['.id']}', '${vlan['vlan-id'] || vlan['vlan-ids'] || 'Unknown'}', '${vlan.bridge || 'Unknown'}')">Remove</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
}

function clearResults() {
    document.getElementById('resultsDisplay').style.display = 'none';
}

function toggleAutoRefresh() {
    const checkbox = document.getElementById('autoRefreshToggle');
    
    if (checkbox.checked && currentRouter) {
        startSystemInfoRefresh();
    } else {
        stopSystemInfoRefresh();
    }
    
    // Redraw chart to update message
    if (trafficChart) {
        trafficChart.draw();
    }
}

function startSystemInfoRefresh() {
    // Clear any existing interval
    stopSystemInfoRefresh();
    
    // Set up new interval for every 5 seconds
    refreshInterval = setInterval(async () => {
        if (currentRouter && document.getElementById('autoRefreshToggle').checked) {
            await refreshSystemInfo();
            // Also update traffic data if WAN interface is detected
            if (window.currentWANInterface) {
                await getTrafficData();
            }
        }
    }, 5000);
    
    // Initialize chart if not already done
    if (!trafficChart) {
        initializeChart();
    }
}

function stopSystemInfoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

async function refreshSystemInfo() {
    if (!currentRouter) return;
    
    const refreshIndicator = document.getElementById('refreshIndicator');
    if (refreshIndicator) {
        refreshIndicator.classList.add('refreshing', 'visible');
    }
    
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: currentRouter.ip,
                username: currentRouter.username,
                password: currentRouter.password
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.systemInfo) {
            populateSystemInfo(result.systemInfo);
        }
    } catch (error) {
        console.log('System info refresh failed:', error.message);
    } finally {
        if (refreshIndicator) {
            refreshIndicator.classList.remove('refreshing');
            // Hide indicator after a short delay
            setTimeout(() => {
                refreshIndicator.classList.remove('visible');
            }, 1000);
        }
    }
}

async function manualRefreshSystemInfo() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    // Disable the button during refresh
    const refreshBtn = document.getElementById('manualRefreshBtn');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '🔄 Refreshing...';
    
    try {
        await refreshSystemInfo();
        showOutput('System information refreshed manually');
    } catch (error) {
        showOutput(`Manual refresh failed: ${error.message}`);
    } finally {
        // Re-enable the button
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;
    }
}

function showOutput(text) {
    const outputEl = document.getElementById('outputArea');
    const timestamp = new Date().toLocaleTimeString();
    outputEl.textContent += `[${timestamp}] ${text}\n\n`;
    outputEl.scrollTop = outputEl.scrollHeight;
}

async function checkForUpdates() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput('Checking for updates...');
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                type: 'update-check'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // First show basic info, then get available versions
            await displayUpdateInfo(result.data);
            showOutput('Update check completed successfully');
        } else {
            showOutput(`Error checking for updates: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

async function displayUpdateInfo(updateData) {
    const updatePanel = document.getElementById('updatePanel');
    const updateInfo = document.getElementById('updateInfo');
    const updateActions = document.getElementById('updateActions');
    
    updatePanel.style.display = 'block';
    
    console.log('Update data received:', updateData); // Debug log
    
    const currentVersion = updateData.system.version || 'Unknown';
    const isRos6 = currentVersion.startsWith('6.');
    const isRos7 = currentVersion.startsWith('7.');
    
    let html = '<table class="update-table">';
    html += '<thead><tr><th>Component</th><th>Current Version</th><th>Available Update</th><th>Channel</th></tr></thead>';
    html += '<tbody>';
    
    // System version row
    html += '<tr>';
    html += '<td><strong>RouterOS</strong></td>';
    html += `<td id="currentVersion"><span class="version-current">${currentVersion}</span></td>`;
    
    let upgradeType = '';
    let upgradeMessage = '';
    let channelInfo = '';
    
    if (isRos6) {
        upgradeType = 'ros6-to-ros7';
        upgradeMessage = 'Start Upgrade Process';
        channelInfo = 'Will use testing channel to upgrade from v6 to v7';
        html += `<td id="targetVersion"><span class="version-target">Checking...</span></td>`;
        html += `<td><span class="channel-badge channel-testing">Testing</span></td>`;
    } else if (isRos7) {
        upgradeType = 'ros7-stable';
        upgradeMessage = 'Start Update Process';
        channelInfo = 'Will use stable channel for v7 updates';
        html += `<td id="targetVersion"><span class="version-target">Checking...</span></td>`;
        html += `<td><span class="channel-badge channel-stable">Stable</span></td>`;
    } else {
        html += `<td>Unable to determine</td>`;
        html += `<td>Unknown</td>`;
    }
    
    html += '</tr>';
    html += '</tbody></table>';
    
    if (upgradeType) {
        html += `<div class="warning-text">`;
        html += `<strong>⚠️ Warning:</strong> ${channelInfo}. This is a 3-step process: Check → Download → Reboot. Ensure you have console access if needed.`;
        html += `</div>`;
        
        updateActions.innerHTML = `
            <button class="upgrade-btn" onclick="startUpgradeProcess('${upgradeType}')">
                ${upgradeMessage}
            </button>
        `;
        updateActions.style.display = 'block';
    } else {
        updateActions.style.display = 'none';
    }
    
    updateInfo.innerHTML = html;
    
    // Fetch actual available versions if we have an upgrade type
    if (upgradeType) {
        try {
            showOutput('Checking for available update versions...');
            
            const versionResponse = await fetch('/api/update-versions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    upgradeType: upgradeType
                })
            });
            
            const versionResult = await versionResponse.json();
            
            if (versionResult.success) {
                const availableVersion = parseAvailableVersion(versionResult.output);
                if (availableVersion) {
                    const targetVersionElement = document.getElementById('targetVersion');
                    const currentVersionElement = document.getElementById('currentVersion');
                    
                    if (targetVersionElement) {
                        targetVersionElement.innerHTML = `<span class="version-target">${availableVersion}</span>`;
                    }
                    
                    // Extract just the version number from current version (remove channel info)
                    const currentVersionClean = currentVersion.replace(/\s*\(.*\)\s*$/, '').trim();
                    
                    // Check if versions match and update styling
                    if (availableVersion === currentVersionClean) {
                        // Versions match - highlight both green and show "Up to date"
                        if (currentVersionElement) {
                            currentVersionElement.innerHTML = `<span class="version-target">${currentVersion}</span>`;
                        }
                        if (targetVersionElement) {
                            targetVersionElement.innerHTML = `<span class="version-target">Up to date</span>`;
                        }
                        showOutput(`System is up to date: ${availableVersion}`);
                        
                        // Hide the upgrade button since no update is needed
                        const updateActions = document.getElementById('updateActions');
                        if (updateActions) {
                            updateActions.style.display = 'none';
                        }
                    } else {
                        showOutput(`Available version: ${availableVersion}`);
                    }
                } else {
                    showOutput('Could not determine available version from output');
                }
            } else {
                showOutput(`Error checking versions: ${versionResult.error}`);
            }
        } catch (error) {
            showOutput(`Error fetching versions: ${error.message}`);
        }
    }
}

function parseAvailableVersion(output) {
    // Parse RouterOS update output to find available version
    // Look for patterns like "latest-version: 7.x.x" or similar
    const lines = output.split('\n');
    
    for (const line of lines) {
        // Look for latest-version field
        if (line.includes('latest-version:')) {
            const match = line.match(/latest-version:\s*(.+)/);
            if (match) {
                return match[1].trim();
            }
        }
        // Alternative pattern - look for version numbers in parentheses or quotes
        const versionMatch = line.match(/(\d+\.\d+\.\d+(?:\.\d+)?)/);
        if (versionMatch && line.includes('latest')) {
            return versionMatch[1];
        }
    }
    
    // Fallback - look for any version pattern in the output
    const allVersions = output.match(/(\d+\.\d+\.\d+(?:\.\d+)?)/g);
    if (allVersions && allVersions.length > 0) {
        // Return the last (presumably latest) version found
        return allVersions[allVersions.length - 1];
    }
    
    return null;
}

async function startUpgradeProcess(upgradeType) {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    // Update the button to show three-step process
    const updateActions = document.getElementById('updateActions');
    updateActions.innerHTML = `
        <div style="margin: 15px 0;">
            <h4>Three-Step Update Process:</h4>
            <button class="upgrade-btn" id="stepCheck" onclick="performUpgradeStep('${upgradeType}', 'check')">
                Step 1: Check for Updates
            </button>
            <button class="upgrade-btn" id="stepDownload" onclick="performUpgradeStep('${upgradeType}', 'download')" disabled>
                Step 2: Download Updates
            </button>
            <button class="upgrade-btn" id="stepReboot" onclick="showRebootModal('update')" disabled>
                Step 3: Reboot & Install
            </button>
        </div>
    `;
}

async function performUpgradeStep(upgradeType, step) {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    const stepBtn = document.getElementById(`step${step.charAt(0).toUpperCase() + step.slice(1)}`);
    const originalText = stepBtn.textContent;
    
    stepBtn.disabled = true;
    stepBtn.textContent = 'Processing...';
    
    showOutput(`Executing step: ${step}...`);
    
    try {
        const response = await fetch('/api/upgrade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                upgradeType: upgradeType,
                step: step
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput(`Step ${step} completed: ${result.message}`);
            stepBtn.textContent = `✓ ${originalText}`;
            stepBtn.style.backgroundColor = '#27ae60';
            
            // Enable next step
            if (step === 'check') {
                document.getElementById('stepDownload').disabled = false;
            } else if (step === 'download') {
                document.getElementById('stepReboot').disabled = false;
            } else if (step === 'reboot') {
                showOutput('Router is rebooting. This may take several minutes...');
                closeUpdatePanel();
            }
        } else {
            showOutput(`Step ${step} failed: ${result.error}`);
            stepBtn.disabled = false;
            stepBtn.textContent = originalText;
        }
    } catch (error) {
        showOutput(`Error in step ${step}: ${error.message}`);
        stepBtn.disabled = false;
        stepBtn.textContent = originalText;
    }
}

function closeUpdatePanel() {
    document.getElementById('updatePanel').style.display = 'none';
}

async function checkRouterboardFirmware() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput('Checking RouterBOARD firmware...');
    
    try {
        const response = await fetch('/api/routerboard-firmware', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                action: 'check'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayFirmwareInfo(result.output);
            showOutput('RouterBOARD firmware check completed');
        } else {
            showOutput(`Error checking firmware: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

function displayFirmwareInfo(output) {
    const firmwarePanel = document.getElementById('firmwarePanel');
    const firmwareInfo = document.getElementById('firmwareInfo');
    const firmwareActions = document.getElementById('firmwareActions');
    
    firmwarePanel.style.display = 'block';
    
    // Parse firmware information from output
    const firmwareData = parseFirmwareInfo(output);
    
    let html = '<table class="firmware-table">';
    html += '<thead><tr><th>Component</th><th>Current Firmware</th><th>Upgrade Firmware</th><th>Status</th></tr></thead>';
    html += '<tbody>';
    
    html += '<tr>';
    html += '<td><strong>RouterBOARD</strong></td>';
    
    if (firmwareData.current === firmwareData.upgrade || !firmwareData.upgrade) {
        // Firmware versions match - highlight both green
        html += `<td><span class="version-target">${firmwareData.current || 'Unknown'}</span></td>`;
        html += `<td><span class="version-target">Up to date</span></td>`;
        html += '<td><span class="status-badge status-enabled">Up to date</span></td>';
        firmwareActions.style.display = 'none';
    } else {
        // Different versions - current blue, upgrade green
        html += `<td><span class="version-current">${firmwareData.current || 'Unknown'}</span></td>`;
        html += `<td><span class="version-target">${firmwareData.upgrade || 'Unknown'}</span></td>`;
        html += '<td><span class="status-badge status-waiting">Update available</span></td>';
        
        firmwareActions.innerHTML = `
            <div class="warning-text">
                <strong>⚠️ Warning:</strong> RouterBOARD firmware upgrade requires a reboot to complete. 
                The process is: Upgrade → Reboot → Firmware installed. Ensure you have console access if needed.
            </div>
            <button class="firmware-btn" onclick="performFirmwareUpgrade()">
                Upgrade Firmware
            </button>
            <button class="firmware-btn" onclick="showRebootModal('firmware')">
                Reboot Router
            </button>
        `;
        firmwareActions.style.display = 'block';
    }
    
    html += '</tr>';
    html += '</tbody></table>';
    
    if (firmwareData.model) {
        html += `<p><strong>Model:</strong> ${firmwareData.model}</p>`;
    }
    if (firmwareData.serialNumber) {
        html += `<p><strong>Serial Number:</strong> ${firmwareData.serialNumber}</p>`;
    }
    
    firmwareInfo.innerHTML = html;
}

function parseFirmwareInfo(output) {
    const info = {
        current: null,
        upgrade: null,
        model: null,
        serialNumber: null
    };
    
    const lines = output.split('\n');
    
    for (const line of lines) {
        if (line.includes('current-firmware:')) {
            const match = line.match(/current-firmware:\s*(.+)/);
            if (match) info.current = match[1].trim();
        }
        if (line.includes('upgrade-firmware:')) {
            const match = line.match(/upgrade-firmware:\s*(.+)/);
            if (match) info.upgrade = match[1].trim();
        }
        if (line.includes('model:')) {
            const match = line.match(/model:\s*(.+)/);
            if (match) info.model = match[1].trim();
        }
        if (line.includes('serial-number:')) {
            const match = line.match(/serial-number:\s*(.+)/);
            if (match) info.serialNumber = match[1].trim();
        }
    }
    
    return info;
}

async function performFirmwareUpgrade() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput('Upgrading RouterBOARD firmware...');
    
    const upgradeBtn = document.querySelector('.firmware-btn');
    if (upgradeBtn) {
        upgradeBtn.disabled = true;
        upgradeBtn.textContent = 'Upgrading...';
    }
    
    try {
        const response = await fetch('/api/routerboard-firmware', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                action: 'upgrade'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput('RouterBOARD firmware upgrade initiated successfully. Please reboot the router to complete the upgrade.');
            
            // Update the UI to show reboot is needed
            const firmwareActions = document.getElementById('firmwareActions');
            firmwareActions.innerHTML = `
                <div class="warning-text" style="background-color: #d4edda; color: #155724; border-color: #28a745;">
                    <strong>✓ Firmware upgrade prepared!</strong> The router must be rebooted to install the new firmware.
                </div>
                <button class="firmware-btn" onclick="showRebootModal('firmware')" style="background-color: #e74c3c;">
                    Reboot Now to Install Firmware
                </button>
            `;
        } else {
            showOutput(`Firmware upgrade failed: ${result.error}`);
            if (upgradeBtn) {
                upgradeBtn.disabled = false;
                upgradeBtn.textContent = 'Upgrade Firmware';
            }
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
        if (upgradeBtn) {
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = 'Upgrade Firmware';
        }
    }
}

function closeFirmwarePanel() {
    document.getElementById('firmwarePanel').style.display = 'none';
}

let currentSearchResults = null;
let selectedTarget = null;

function openQueueManager() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    document.getElementById('queuePanel').style.display = 'block';
    document.getElementById('queueResults').style.display = 'none';
    document.getElementById('queueModify').style.display = 'none';
    document.getElementById('searchValue').value = '';
}

function createPaginationControls(currentPage, totalPages, totalItems, type = 'Queue') {
    let html = '<div class="pagination-controls">';
    html += `<span class="pagination-info">Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} ${type === 'DHCP' ? 'DHCP leases' : 'queues'}</span>`;
    html += '<div class="pagination-buttons">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="queue-btn" onclick="changePage(${currentPage - 1}, '${type}')">Previous</button>`;
    }
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="queue-btn" onclick="changePage(1, '${type}')">1</button>`;
        if (startPage > 2) html += '<span>...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="queue-btn active">${i}</button>`;
        } else {
            html += `<button class="queue-btn" onclick="changePage(${i}, '${type}')">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span>...</span>';
        html += `<button class="queue-btn" onclick="changePage(${totalPages}, '${type}')">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="queue-btn" onclick="changePage(${currentPage + 1}, '${type}')">Next</button>`;
    }
    
    html += '</div></div>';
    return html;
}

function changePage(page, type) {
    if (allQueueData) {
        if (type === 'DHCP') {
            displaySearchResults(allQueueData, true, page, currentQueuePage, isShowingOnlyQueues);
        } else {
            displaySearchResults(allQueueData, true, currentDHCPPage, page, isShowingOnlyQueues);
        }
    }
}

async function loadBlockedCustomers() {
    if (!currentRouter) {
        return;
    }
    
    try {
        const response = await fetch('/api/blocked-customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            blockedCustomers = result.data.addresses;
        } else {
            console.error('Failed to load blocked customers:', result.error);
        }
    } catch (error) {
        console.error('Error loading blocked customers:', error.message);
    }
}

async function toggleBlock(ipAddress, action) {
    if (!currentRouter) {
        showOutput('Please connect to a router first');
        return;
    }
    
    try {
        const response = await fetch('/api/block-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                action: action,
                ipAddress: ipAddress
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the local blocked customers list
            if (action === 'block') {
                if (!blockedCustomers.includes(ipAddress)) {
                    blockedCustomers.push(ipAddress);
                }
            } else {
                blockedCustomers = blockedCustomers.filter(ip => ip !== ipAddress);
            }
            
            // Refresh the display
            if (allQueueData) {
                displaySearchResults(allQueueData, true, currentDHCPPage, currentQueuePage, isShowingOnlyQueues);
            }
            
            showOutput(`IP ${ipAddress} has been ${action}ed successfully`);
        } else {
            showOutput(`Failed to ${action} IP ${ipAddress}: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

async function showAllQueues() {
    if (!currentRouter) {
        showOutput('Please connect to a router first');
        return;
    }
    
    try {
        const response = await fetch('/api/all-queues', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            allQueueData = {
                dhcp: [],
                queues: result.data.queues
            };
            
            // Load blocked customers before displaying results
            await loadBlockedCustomers();
            
            displaySearchResults(allQueueData, true, 1, 1, true);
        } else {
            showOutput(`Failed to fetch queues: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

async function searchForRouter() {
    const searchValue = document.getElementById('searchValue').value.trim();
    
    if (!searchValue) {
        showOutput('Please enter a search value');
        return;
    }
    
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    showOutput(`Searching for: ${searchValue}...`);
    
    try {
        const response = await fetch('/api/queue-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                searchValue: searchValue,
                searchType: 'auto'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentSearchResults = result.data;
            allQueueData = result.data;
            
            // Load blocked customers before displaying results
            await loadBlockedCustomers();
            
            displaySearchResults(result.data, true, 1, 1, false);
            showOutput(`Search completed. Found results in DHCP and Queue tables.`);
        } else {
            showOutput(`Search failed: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

// Pagination variables
let currentQueuePage = 1;
let currentDHCPPage = 1;
let itemsPerPage = 10;
let allQueueData = null;
let isShowingOnlyQueues = false;
let blockedCustomers = [];

function displaySearchResults(data, isPaginated = false, dhcpPage = 1, queuePage = 1, showOnlyQueues = false) {
    const resultsDiv = document.getElementById('queueResults');
    isShowingOnlyQueues = showOnlyQueues;
    let html = showOnlyQueues ? '<h3>All Queues</h3>' : '<h3>Search Results</h3>';
    
    // DHCP Leases
    if (!showOnlyQueues && data.dhcp && data.dhcp.length > 0) {
        let dhcpToDisplay = data.dhcp;
        let totalDHCP = data.dhcp.length;
        let totalDHCPPages = 1;
        
        // Handle pagination if enabled
        if (isPaginated && totalDHCP > itemsPerPage) {
            totalDHCPPages = Math.ceil(totalDHCP / itemsPerPage);
            currentDHCPPage = Math.min(dhcpPage, totalDHCPPages);
            const startIndex = (currentDHCPPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            dhcpToDisplay = data.dhcp.slice(startIndex, endIndex);
            
            // Add pagination controls at the top
            html += createPaginationControls(currentDHCPPage, totalDHCPPages, totalDHCP, 'DHCP');
        }
        
        html += '<h4>DHCP Leases</h4>';
        html += '<table class="queue-table"><thead><tr><th>IP Address</th><th>MAC Address</th><th>Hostname</th><th>Status</th><th>Comment</th><th>Actions</th></tr></thead><tbody>';
        dhcpToDisplay.forEach(lease => {
            const isBlocked = blockedCustomers.includes(lease.address);
            html += '<tr>';
            html += `<td><span class="ip-address">${lease.address || '-'}</span></td>`;
            html += `<td>${lease['mac-address'] || '-'}</td>`;
            html += `<td>${lease['host-name'] || '-'}</td>`;
            html += `<td><span class="status-badge ${lease.status === 'bound' ? 'status-bound' : 'status-waiting'}">${lease.status || 'unknown'}</span></td>`;
            html += `<td class="comment-cell">${lease.comment || '-'}</td>`;
            html += `<td>`;
            html += `<button class="queue-btn" onclick="selectTarget('${lease.address}', 'DHCP: ${lease['host-name'] || lease.address}')">Select</button>`;
            if (lease.address) {
                const blockAction = isBlocked ? 'unblock' : 'block';
                const blockText = isBlocked ? 'UNBLOCK' : 'BLOCK';
                const blockClass = isBlocked ? 'queue-btn-unblock' : 'queue-btn-block';
                html += ` <button class="queue-btn ${blockClass}" onclick="toggleBlock('${lease.address}', '${blockAction}')">${blockText}</button>`;
            }
            html += `</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        // Add pagination controls at the bottom if paginated
        if (isPaginated && totalDHCPPages > 1) {
            html += createPaginationControls(currentDHCPPage, totalDHCPPages, totalDHCP, 'DHCP');
        }
    }
    
    // ARP Entries removed - using DHCP only
    
    // Existing Queues
    if (data.queues && data.queues.length > 0) {
        let queuesToDisplay = data.queues;
        let totalQueues = data.queues.length;
        let totalPages = 1;
        
        // Handle pagination if enabled
        if (isPaginated && totalQueues > itemsPerPage) {
            totalPages = Math.ceil(totalQueues / itemsPerPage);
            currentQueuePage = Math.min(queuePage, totalPages);
            const startIndex = (currentQueuePage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            queuesToDisplay = data.queues.slice(startIndex, endIndex);
            
            // Add pagination controls at the top
            html += createPaginationControls(currentQueuePage, totalPages, totalQueues, 'Queue');
        }
        
        html += '<h4>Existing Queues</h4>';
        html += '<table class="queue-table"><thead><tr><th>Name</th><th>Target</th><th>Max Limit</th><th>Action</th></tr></thead><tbody>';
        queuesToDisplay.forEach(queue => {
            html += '<tr>';
            html += `<td>${queue.name || '-'}</td>`;
            html += `<td><span class="ip-address">${queue.target || '-'}</span></td>`;
            html += `<td>${formatMaxLimit(queue['max-limit'])}</td>`;
            html += `<td><button class="queue-btn" onclick="selectExistingQueue('${queue['.id']}', '${queue.target}', '${queue['max-limit'] || ''}', '${queue.name || ''}', '${queue.comment || ''}', '${queue['burst-limit'] || ''}', '${queue['burst-threshold'] || ''}', '${queue['burst-time'] || ''}')">Edit</button></td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        // Add pagination controls at the bottom if paginated
        if (isPaginated && totalPages > 1) {
            html += createPaginationControls(currentQueuePage, totalPages, totalQueues, 'Queue');
        }
    }
    
    if ((!data.dhcp || data.dhcp.length === 0) && (!data.queues || data.queues.length === 0)) {
        html += '<p>No results found for the search term.</p>';
    }
    
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function selectTarget(ipAddress, description) {
    selectedTarget = {
        ip: ipAddress,
        description: description,
        isNew: true
    };
    
    showQueueModifySection();
    showOutput(`Selected target: ${description} (${ipAddress})`);
}

function selectExistingQueue(queueId, target, maxLimit, name, comment, burstLimit = '', burstThreshold = '', burstTime = '') {
    // Parse max-limit (format: upload/download)
    const limits = maxLimit.split('/');
    const upload = limits[0] || '';
    const download = limits[1] || '';
    
    // Parse burst parameters
    const burstLimits = burstLimit ? burstLimit.split('/') : ['', ''];
    const burstThresholds = burstThreshold ? burstThreshold.split('/') : ['', ''];
    const burstTimes = burstTime ? burstTime.split('/') : ['', ''];
    
    // Convert from bits to Mbps if needed
    function convertToMbps(value) {
        if (!value) return '';
        
        // Remove any existing unit suffix (M, K, G)
        const numericValue = value.replace(/[MKG]$/i, '');
        
        // If it's a large number (likely in bits), convert to Mbps
        if (/^\d+$/.test(numericValue) && parseInt(numericValue) >= 1000000) {
            return Math.round(parseInt(numericValue) / 1000000).toString();
        }
        
        // If it already has a unit or is a reasonable number, keep as is
        return numericValue;
    }
    
    // Convert time values (remove 's' suffix)
    function convertTime(value) {
        if (!value) return '';
        return value.replace(/s$/i, '');
    }
    
    const uploadMbps = convertToMbps(upload);
    const downloadMbps = convertToMbps(download);
    
    selectedTarget = {
        id: queueId,
        ip: target,
        description: `Existing Queue: ${name}`,
        isNew: false,
        currentUpload: uploadMbps,
        currentDownload: downloadMbps,
        currentComment: comment || '',
        currentBurstUpload: convertToMbps(burstLimits[0]),
        currentBurstDownload: convertToMbps(burstLimits[1]),
        currentBurstThresholdUpload: convertToMbps(burstThresholds[0]),
        currentBurstThresholdDownload: convertToMbps(burstThresholds[1]),
        currentBurstTimeUpload: convertTime(burstTimes[0]),
        currentBurstTimeDownload: convertTime(burstTimes[1])
    };
    
    showQueueModifySection();
    
    showOutput(`Selected existing queue: ${name} (${target}) - Current: ${upload}/${download} (${uploadMbps}M/${downloadMbps}M)`);
}

function showQueueModifySection() {
    const modifyDiv = document.getElementById('queueModify');
    modifyDiv.style.display = 'block';
    
    // Update the header text and set default values
    const header = modifyDiv.querySelector('h3');
    if (selectedTarget.isNew) {
        header.textContent = `Create Queue for ${selectedTarget.description}`;
        // Set default values for new queues
        document.getElementById('maxUpload').value = '100';
        document.getElementById('maxDownload').value = '100';
        document.getElementById('queueComment').value = 'ADDED-THROUGH-GUARDIAN.RELAY -- ';
        // Clear burst fields for new queues
        document.getElementById('burstUpload').value = '';
        document.getElementById('burstDownload').value = '';
        document.getElementById('burstThresholdUpload').value = '';
        document.getElementById('burstThresholdDownload').value = '';
        document.getElementById('burstTimeUpload').value = '';
        document.getElementById('burstTimeDownload').value = '';
    } else {
        header.textContent = `Modify Queue for ${selectedTarget.description}`;
        // Preserve existing values for editing
        if (selectedTarget.currentUpload) {
            document.getElementById('maxUpload').value = selectedTarget.currentUpload;
        }
        if (selectedTarget.currentDownload) {
            document.getElementById('maxDownload').value = selectedTarget.currentDownload;
        }
        if (selectedTarget.currentComment !== undefined) {
            document.getElementById('queueComment').value = selectedTarget.currentComment;
        }
        // Populate burst fields
        document.getElementById('burstUpload').value = selectedTarget.currentBurstUpload || '';
        document.getElementById('burstDownload').value = selectedTarget.currentBurstDownload || '';
        document.getElementById('burstThresholdUpload').value = selectedTarget.currentBurstThresholdUpload || '';
        document.getElementById('burstThresholdDownload').value = selectedTarget.currentBurstThresholdDownload || '';
        document.getElementById('burstTimeUpload').value = selectedTarget.currentBurstTimeUpload || '';
        document.getElementById('burstTimeDownload').value = selectedTarget.currentBurstTimeDownload || '';
    }
}

async function updateQueueSpeeds() {
    if (!selectedTarget) {
        showOutput('No target selected');
        return;
    }
    
    let maxUpload = document.getElementById('maxUpload').value.trim();
    let maxDownload = document.getElementById('maxDownload').value.trim();
    let comment = document.getElementById('queueComment').value.trim();
    
    // Get burst configuration values
    let burstUpload = document.getElementById('burstUpload').value.trim();
    let burstDownload = document.getElementById('burstDownload').value.trim();
    let burstThresholdUpload = document.getElementById('burstThresholdUpload').value.trim();
    let burstThresholdDownload = document.getElementById('burstThresholdDownload').value.trim();
    let burstTimeUpload = document.getElementById('burstTimeUpload').value.trim();
    let burstTimeDownload = document.getElementById('burstTimeDownload').value.trim();
    
    if (!maxUpload || !maxDownload) {
        showOutput('Please enter both upload and download speeds');
        return;
    }
    
    // Helper function to append 'M' to numeric values
    function formatSpeed(speed) {
        if (!speed) return '';
        // If it's purely numeric (integer or decimal), append 'M'
        if (/^\d+(\.\d+)?$/.test(speed)) {
            return speed + 'M';
        }
        // If it already has a unit (M, K, G, etc.) or is not numeric, return as is
        return speed;
    }
    
    // Helper function to format time values
    function formatTime(time) {
        if (!time) return '';
        // Just return the numeric value (no 's' suffix needed)
        if (/^\d+(\.\d+)?$/.test(time)) {
            return time;
        }
        // Remove 's' suffix if present
        return time.replace(/s$/i, '');
    }
    
    // Process the speed values
    maxUpload = formatSpeed(maxUpload);
    maxDownload = formatSpeed(maxDownload);
    
    // Process burst values (only if provided)
    if (burstUpload) burstUpload = formatSpeed(burstUpload);
    if (burstDownload) burstDownload = formatSpeed(burstDownload);
    if (burstThresholdUpload) burstThresholdUpload = formatSpeed(burstThresholdUpload);
    if (burstThresholdDownload) burstThresholdDownload = formatSpeed(burstThresholdDownload);
    if (burstTimeUpload) burstTimeUpload = formatTime(burstTimeUpload);
    if (burstTimeDownload) burstTimeDownload = formatTime(burstTimeDownload);
    
    console.log('Burst values before sending:', {
        burstUpload, burstDownload, burstThresholdUpload, burstThresholdDownload, burstTimeUpload, burstTimeDownload
    });
    
    showOutput(`${selectedTarget.isNew ? 'Creating' : 'Updating'} CAKE queue for ${selectedTarget.ip}...`);
    
    try {
        const response = await fetch('/api/queue-modify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                action: 'update',
                queueData: {
                    id: selectedTarget.id || null,
                    target: selectedTarget.ip,
                    name: `CAKE-${selectedTarget.ip}`,
                    maxUpload: maxUpload,
                    maxDownload: maxDownload,
                    burstUpload: burstUpload,
                    burstDownload: burstDownload,
                    burstThresholdUpload: burstThresholdUpload,
                    burstThresholdDownload: burstThresholdDownload,
                    burstTimeUpload: burstTimeUpload,
                    burstTimeDownload: burstTimeDownload,
                    comment: comment || 'ADDED-THROUGH-GUARDIAN.RELAY -- '
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput(`CAKE queue ${selectedTarget.isNew ? 'created' : 'updated'} successfully: ${maxUpload}/${maxDownload}`);
            // Refresh search results
            searchForRouter();
        } else {
            showOutput(`CAKE queue operation failed: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

async function removeQueue() {
    if (!selectedTarget) {
        showOutput('No target selected to remove queue');
        return;
    }
    
    showOutput(`Removing queue for ${selectedTarget.ip}...`);
    
    try {
        const response = await fetch('/api/queue-modify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                action: 'remove',
                queueData: {
                    target: selectedTarget.ip
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput(`Queue removed successfully`);
            // Hide modify section and refresh results
            document.getElementById('queueModify').style.display = 'none';
            searchForRouter();
        } else {
            showOutput(`Queue removal failed: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error: ${error.message}`);
    }
}

function closeQueuePanel() {
    document.getElementById('queuePanel').style.display = 'none';
    selectedTarget = null;
    currentSearchResults = null;
}

// Reboot Modal Functions
function showRebootModal(context = 'manual') {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    // Populate router info in modal
    const routerInfoDiv = document.getElementById('rebootRouterInfo');
    const deviceName = document.getElementById('deviceName').textContent || 'Unknown';
    const routerIP = currentRouter.ip;
    const routerOSVersion = document.getElementById('routerOSVersion').textContent || 'Unknown';
    
    routerInfoDiv.innerHTML = `
        <strong>Router:</strong> ${deviceName}<br>
        <strong>IP Address:</strong> ${routerIP}<br>
        <strong>RouterOS Version:</strong> ${routerOSVersion}
    `;
    
    // Update modal content based on context
    const modalTitle = document.getElementById('rebootModalTitle');
    const modalMessage = document.getElementById('rebootModalMessage');
    
    if (context === 'update') {
        modalTitle.textContent = '⚠️ Confirm Reboot and Install Updates';
        modalMessage.textContent = 'Are you sure you want to reboot the router and install the downloaded updates?';
    } else if (context === 'firmware') {
        modalTitle.textContent = '⚠️ Confirm Firmware Installation Reboot';
        modalMessage.textContent = 'Are you sure you want to reboot the router to install the new firmware?';
    } else {
        modalTitle.textContent = '⚠️ Confirm Router Reboot';
        modalMessage.textContent = 'Are you sure you want to reboot the router?';
    }
    
    // Reset modal state
    document.querySelector('input[name="rebootOption"][value="immediate"]').checked = true;
    document.getElementById('scheduleSection').style.display = 'none';
    updateConfirmButton();
    
    // Set up radio button event listeners
    setupRebootOptionListeners();
    
    // Set default date/time to 1 AM the next day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(1, 0, 0, 0); // Set to 1:00 AM
    
    document.getElementById('scheduleDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('scheduleTime').value = '01:00';
    
    // Store context for later use
    document.getElementById('rebootModal').dataset.context = context;
    
    // Show modal
    document.getElementById('rebootModal').style.display = 'flex';
}

function setupRebootOptionListeners() {
    const radioButtons = document.querySelectorAll('input[name="rebootOption"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const scheduleSection = document.getElementById('scheduleSection');
            const routerTimeInfo = document.getElementById('routerTimeInfo');
            
            if (this.value === 'scheduled') {
                scheduleSection.style.display = 'block';
                routerTimeInfo.style.display = 'block';
                fetchRouterTime();
            } else {
                scheduleSection.style.display = 'none';
                routerTimeInfo.style.display = 'none';
            }
            updateConfirmButton();
        });
    });
}

function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirmRebootBtn');
    const selectedOption = document.querySelector('input[name="rebootOption"]:checked').value;
    
    if (selectedOption === 'immediate') {
        confirmBtn.textContent = 'Yes, Reboot Now';
    } else {
        confirmBtn.textContent = 'Schedule Reboot';
    }
}

function closeRebootModal() {
    document.getElementById('rebootModal').style.display = 'none';
}

function confirmReboot() {
    const selectedOption = document.querySelector('input[name="rebootOption"]:checked').value;
    const context = document.getElementById('rebootModal').dataset.context || 'manual';
    
    if (selectedOption === 'immediate') {
        closeRebootModal();
        
        // Execute appropriate reboot command based on context
        if (context === 'update') {
            sendCommand('system reboot');
            showOutput('Router is rebooting to install updates...');
        } else if (context === 'firmware') {
            sendCommand('system reboot');
            showOutput('Router is rebooting to install firmware...');
        } else {
            sendCommand('system reboot');
        }
    } else {
        // Schedule reboot
        const scheduleDate = document.getElementById('scheduleDate').value;
        const scheduleTime = document.getElementById('scheduleTime').value;
        
        if (!scheduleDate || !scheduleTime) {
            alert('Please select both date and time for the scheduled reboot.');
            return;
        }
        
        scheduleReboot(scheduleDate, scheduleTime, context);
        closeRebootModal();
    }
}

async function scheduleReboot(date, time, context) {
    if (!currentRouter) {
        showOutput('Error: Not connected to any router');
        return;
    }
    
    // Convert date and time to MikroTik scheduler format
    const dateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (dateTime <= now) {
        showOutput('Error: Scheduled time must be in the future');
        return;
    }
    
    // Format date and time for MikroTik scheduler (YYYY-MM-DD and HH:mm:ss)
    const year = dateTime.getFullYear();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    const hours = dateTime.getHours().toString().padStart(2, '0');
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    
    const startDate = `${year}-${month}-${day}`;
    const startTime = `${hours}:${minutes}:00`;
    const schedulerName = `reboot_scheduled_${Date.now()}`;
    
    let command;
    if (context === 'update') {
        command = `/system/scheduler/add name="${schedulerName}" on-event="/system/reboot" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon start-date=${startDate} start-time=${startTime} comment="NETWORK-RELAY:SCHEDULED-REBOOT"`;
    } else if (context === 'firmware') {
        command = `/system/scheduler/add name="${schedulerName}" on-event="/system/reboot" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon start-date=${startDate} start-time=${startTime} comment="NETWORK-RELAY:SCHEDULED-REBOOT"`;
    } else {
        command = `/system/scheduler/add name="${schedulerName}" on-event="/system/reboot" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon start-date=${startDate} start-time=${startTime} comment="NETWORK-RELAY:SCHEDULED-REBOOT"`;
    }
    
    showOutput(`Scheduling reboot for ${dateTime.toLocaleString()}...`);
    
    try {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                command: command
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showOutput(`✓ Reboot scheduled successfully for ${dateTime.toLocaleString()}`);
            showOutput(`Scheduler name: ${schedulerName}`);
            if (context === 'update') {
                showOutput('The router will automatically reboot and install updates at the scheduled time.');
            } else if (context === 'firmware') {
                showOutput('The router will automatically reboot and install firmware at the scheduled time.');
            }
        } else {
            showOutput(`Error scheduling reboot: ${result.error}`);
        }
    } catch (error) {
        showOutput(`Error scheduling reboot: ${error.message}`);
    }
}

async function fetchRouterTime() {
    if (!currentRouter) {
        document.getElementById('routerCurrentTime').innerHTML = 'Error: Not connected to device';
        return;
    }
    
    // Show loading state
    document.getElementById('routerCurrentTime').innerHTML = 'Loading device time...';
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                type: 'system-clock'
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            const clockData = result.data[0];
            
            // Format the time display
            let timeDisplay = '';
            
            if (clockData.time) {
                timeDisplay += `<strong>Current Time:</strong> ${clockData.time}<br>`;
            }
            if (clockData.date) {
                timeDisplay += `<strong>Current Date:</strong> ${clockData.date}<br>`;
            }
            if (clockData['time-zone-name']) {
                timeDisplay += `<strong>Time Zone:</strong> ${clockData['time-zone-name']}`;
            } else if (clockData['time-zone-autodetect'] === 'true') {
                timeDisplay += `<strong>Time Zone:</strong> Auto-detected`;
            }
            
            if (!timeDisplay) {
                timeDisplay = `<strong>Device Time:</strong> ${clockData.time || 'Unknown'}<br>`;
                timeDisplay += `<strong>Date:</strong> ${clockData.date || 'Unknown'}`;
            }
            
            document.getElementById('routerCurrentTime').innerHTML = timeDisplay;
        } else {
            document.getElementById('routerCurrentTime').innerHTML = 'Unable to retrieve device time';
        }
    } catch (error) {
        document.getElementById('routerCurrentTime').innerHTML = `Error fetching device time: ${error.message}`;
    }
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('rebootModal');
    if (event.target === modal) {
        closeRebootModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRebootModal();
    }
});

// Stop refresh when page is unloaded
window.addEventListener('beforeunload', stopSystemInfoRefresh);

// Traffic Monitoring Functions
let trafficChart = null;
let trafficData = {
    labels: [],
    upload: [],
    download: []
};
const MAX_DATA_POINTS = 60; // Show last 60 seconds

function initializeTrafficMonitor() {
    // Initialize chart first
    if (!trafficChart) {
        initializeChart();
    }
    
    // Draw initial message
    if (trafficChart) {
        trafficChart.draw();
    }
    
    // Get WAN interface on connection
    detectWANInterface();
}

async function detectWANInterface() {
    if (!currentRouter) return;
    
    console.log('Detecting WAN interface...');
    await populateInterfaceDropdown();
}

async function populateInterfaceDropdown() {
    if (!currentRouter) return;
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                type: 'interfaces'
            })
        });
        
        const result = await response.json();
        console.log('Available interfaces:', result);
        
        const select = document.getElementById('interfaceSelect');
        // Clear existing options except "Auto-detect"
        select.innerHTML = '<option value="">Auto-detect</option>';
        
        if (result.success && result.data) {
            // Add all interfaces to dropdown
            result.data.forEach(iface => {
                if (iface.name) {
                    const option = document.createElement('option');
                    option.value = iface.name;
                    option.textContent = `${iface.name} (${iface.running === 'true' ? 'Running' : 'Down'})`;
                    select.appendChild(option);
                }
            });
            
            // Try to detect WAN interface via routing table
            await detectWANViaRoutes(result.data);
        }
    } catch (error) {
        console.error('Error populating interface dropdown:', error);
    }
}

async function detectWANViaRoutes(interfaces) {
    try {
        // Simplified approach - get route with print detail to see immediate-gw
        const script = '/ip route print detail where dst-address="0.0.0.0/0" active=yes';
        
        const routeResponse = await fetch('/api/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                command: script
            })
        });
        
        const routeResult = await routeResponse.json();
        console.log('WAN detection script result:', routeResult);
        
        if (routeResult.success && routeResult.output) {
            const routeOutput = routeResult.output.trim();
            console.log('🔍 Raw route output:', JSON.stringify(routeOutput));
            console.log('🔍 Raw route output (readable):', routeOutput);
            
            // Parse the route output to find immediate-gw
            const lines = routeOutput.split('\n');
            let detectedInterface = null;
            let lowestDistance = 999;
            
            console.log('🔍 Total lines to process:', lines.length);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                console.log(`🔍 Line ${i}:`, JSON.stringify(line));
                
                // Look for immediate-gw in the output
                if (line.includes('immediate-gw=')) {
                    console.log('🔍 Line contains immediate-gw, attempting to extract...');
                    
                    // Find the start of immediate-gw=
                    const gwIndex = line.indexOf('immediate-gw=');
                    if (gwIndex !== -1) {
                        // Extract everything after "immediate-gw="
                        let gwValue = line.substring(gwIndex + 'immediate-gw='.length);
                        console.log('🔍 Raw gw value:', JSON.stringify(gwValue));
                        
                        // Find the end by looking for the next parameter (space followed by word=)
                        // But be more careful about what constitutes a parameter
                        const nextParamMatch = gwValue.match(/\s+(distance|scope|target-scope|check-gateway|pref-src|vrf-interface|routing-mark)=/);
                        if (nextParamMatch) {
                            gwValue = gwValue.substring(0, nextParamMatch.index);
                        }
                        
                        const immediateGw = gwValue.trim();
                        console.log('🔍 Extracted immediate-gw value:', JSON.stringify(immediateGw));
                        
                        // Extract interface from immediate gateway
                        if (immediateGw.includes('%')) {
                            const parts = immediateGw.split('%');
                            if (parts.length > 1) {
                                const interfaceName = parts[1].trim();
                                console.log('🔍 Extracted interface from %:', JSON.stringify(interfaceName));
                                
                                // Check if this interface exists and is running
                                const foundInterface = interfaces.find(iface => 
                                    iface.name === interfaceName && iface.running === 'true'
                                );
                                
                                if (foundInterface) {
                                    // Try to find distance for this route
                                    let distance = 1; // default
                                    const distMatch = line.match(/distance=(\d+)/);
                                    if (distMatch) {
                                        distance = parseInt(distMatch[1]);
                                    }
                                    
                                    console.log('🔍 Interface found with distance:', interfaceName, distance);
                                    
                                    if (distance < lowestDistance) {
                                        lowestDistance = distance;
                                        detectedInterface = interfaceName;
                                    }
                                } else {
                                    console.log('🔍 Interface not found or not running:', JSON.stringify(interfaceName));
                                }
                            } else {
                                console.log('🔍 No % separator found in immediate-gw:', immediateGw);
                            }
                        } else {
                            console.log('🔍 No % found in immediate-gw value:', immediateGw);
                        }
                    }
                }
            }
            
            console.log('🔍 Final extracted interface:', detectedInterface);
            
            // Verify the interface exists and is running
            if (detectedInterface) {
                console.log('🔍 Looking for interface in available list:', detectedInterface);
                console.log('🔍 Available interfaces:', interfaces.map(i => `${i.name} (running: ${i.running})`));
                
                const foundInterface = interfaces.find(iface => 
                    iface.name === detectedInterface && iface.running === 'true'
                );
                
                if (foundInterface) {
                    console.log('✅ Auto-detected WAN interface:', detectedInterface);
                    document.getElementById('interfaceSelect').value = detectedInterface;
                    window.currentWANInterface = detectedInterface;
                    return;
                } else {
                    console.log('⚠️ Detected interface not found or not running:', detectedInterface);
                    console.log('🔍 Exact match check - looking for:', JSON.stringify(detectedInterface));
                    interfaces.forEach(iface => {
                        if (iface.name && iface.name.includes(detectedInterface)) {
                            console.log('🔍 Partial match found:', iface.name);
                        }
                    });
                }
            }
        }
        
        // Fallback to original logic if route detection fails
        console.log('Route detection failed, falling back to interface patterns');
        
        // Try ethernet interfaces first
        const ethInterface = interfaces.find(iface => 
            iface.name && 
            (iface.name.startsWith('ether') || iface.name.includes('eth')) && 
            iface.running === 'true'
        );
        
        if (ethInterface) {
            console.log('Fallback: Auto-selected ethernet interface:', ethInterface.name);
            document.getElementById('interfaceSelect').value = ethInterface.name;
            window.currentWANInterface = ethInterface.name;
        } else {
            // Try any running interface that's not a bridge
            const runningInterface = interfaces.find(iface => 
                iface.name && 
                iface.running === 'true' && 
                !iface.name.toLowerCase().includes('bridge') &&
                !iface.name.toLowerCase().includes('wlan')
            );
            
            if (runningInterface) {
                console.log('Fallback: Auto-selected running interface:', runningInterface.name);
                document.getElementById('interfaceSelect').value = runningInterface.name;
                window.currentWANInterface = runningInterface.name;
            }
        }
        
    } catch (error) {
        console.error('Error detecting WAN via routes:', error);
    }
}

function changeWANInterface() {
    const select = document.getElementById('interfaceSelect');
    const selectedInterface = select.value;
    
    if (selectedInterface) {
        console.log('Manually selected interface:', selectedInterface);
        window.currentWANInterface = selectedInterface;
        // Clear existing traffic data
        trafficData = { labels: [], upload: [], download: [] };
        if (trafficChart) {
            trafficChart.ctx.clearRect(0, 0, trafficChart.width, trafficChart.height);
        }
    } else {
        // Auto-detect was selected
        detectWANInterface();
    }
}

function refreshInterfaces() {
    populateInterfaceDropdown();
}



function initializeChart() {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // Simple chart drawing without Chart.js
    trafficChart = {
        ctx: ctx,
        width: ctx.canvas.width,
        height: ctx.canvas.height,
        draw: function() {
            // Clear canvas
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Check if auto-refresh is enabled
            const autoRefreshEnabled = document.getElementById('autoRefreshToggle').checked;
            
            if (!autoRefreshEnabled || trafficData.labels.length < 2) {
                // Draw message when no data or auto-refresh disabled
                ctx.fillStyle = '#666';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                let message = 'Enable auto-refresh to view traffic rates';
                if (autoRefreshEnabled && trafficData.labels.length < 2) {
                    message = 'Collecting traffic data...';
                }
                
                ctx.fillText(message, this.width / 2, this.height / 2);
                return;
            }
            
            // Draw grid
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            
            // Horizontal lines
            for (let i = 0; i <= 5; i++) {
                const y = (this.height / 5) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
            
            // Calculate scale
            const maxValue = Math.max(
                ...trafficData.upload,
                ...trafficData.download,
                10 // Minimum 10 Mbps scale
            );
            
            // Draw upload line (red)
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < trafficData.upload.length; i++) {
                const x = (this.width / (MAX_DATA_POINTS - 1)) * i;
                const y = this.height - (trafficData.upload[i] / maxValue) * this.height;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Draw download line (green)
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < trafficData.download.length; i++) {
                const x = (this.width / (MAX_DATA_POINTS - 1)) * i;
                const y = this.height - (trafficData.download[i] / maxValue) * this.height;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Draw scale labels
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const value = (maxValue / 5) * (5 - i);
                const y = (this.height / 5) * i;
                ctx.fillText(value.toFixed(1) + ' Mbps', this.width - 5, y + 10);
            }
        }
    };
}

async function getTrafficData() {
    if (!currentRouter || !window.currentWANInterface) return;
    
    try {
        const response = await fetch('/api/traffic-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                interface: window.currentWANInterface
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // Update current speed display
            const uploadMbps = (result.data.txRate / 1000000).toFixed(2);
            const downloadMbps = (result.data.rxRate / 1000000).toFixed(2);
            
            document.querySelector('.speed-up').textContent = `↑ ${uploadMbps} Mbps`;
            document.querySelector('.speed-down').textContent = `↓ ${downloadMbps} Mbps`;
            
            // Add to chart data
            const now = new Date();
            trafficData.labels.push(now.toLocaleTimeString());
            trafficData.upload.push(parseFloat(uploadMbps));
            trafficData.download.push(parseFloat(downloadMbps));
            
            // Keep only last MAX_DATA_POINTS
            if (trafficData.labels.length > MAX_DATA_POINTS) {
                trafficData.labels.shift();
                trafficData.upload.shift();
                trafficData.download.shift();
            }
            
            // Redraw chart
            if (trafficChart) {
                trafficChart.draw();
            }
        }
    } catch (error) {
        console.error('Error getting traffic data:', error);
    }
}

// Device Type Selection Functions
function selectDeviceType(deviceType) {
    // Hide device type selector
    document.getElementById('deviceTypeSection').style.display = 'none';
    
    // Hide all device controls
    document.getElementById('routerControls').style.display = 'none';
    document.getElementById('switchControls').style.display = 'none';
    document.getElementById('wirelessControls').style.display = 'none';
    
    // Show selected device controls
    switch(deviceType) {
        case 'router':
            document.getElementById('routerControls').style.display = 'block';
            break;
        case 'switch':
            document.getElementById('switchControls').style.display = 'block';
            break;
        case 'wireless':
            document.getElementById('wirelessControls').style.display = 'block';
            break;
    }
    
    // Store current device type
    window.currentDeviceType = deviceType;
}

function backToDeviceSelection() {
    // Show device type selector
    document.getElementById('deviceTypeSection').style.display = 'block';
    
    // Hide all device controls
    document.getElementById('routerControls').style.display = 'none';
    document.getElementById('switchControls').style.display = 'none';
    document.getElementById('wirelessControls').style.display = 'none';
    
    // Clear current device type
    window.currentDeviceType = null;
}

// Table sorting functions
let sortDirections = {0: null, 1: null, 2: null};
let vlanSortDirections = {0: null};

function sortRoutesTable(columnIndex) {
    if (!window.currentRoutesData) return;
    
    // Toggle sort direction (null -> asc -> desc -> asc...)
    if (sortDirections[columnIndex] === null || sortDirections[columnIndex] === 'desc') {
        sortDirections[columnIndex] = 'asc';
    } else {
        sortDirections[columnIndex] = 'desc';
    }
    
    // Sort the data
    const sortedRoutes = [...window.currentRoutesData].sort((a, b) => {
        let aValue, bValue;
        
        switch(columnIndex) {
            case 0: // Destination
                aValue = a['dst-address'] || '';
                bValue = b['dst-address'] || '';
                break;
            case 1: // Gateway
                aValue = a.gateway || '';
                bValue = b.gateway || '';
                break;
            case 2: // Distance
                aValue = parseInt(a.distance) || 0;
                bValue = parseInt(b.distance) || 0;
                return sortDirections[columnIndex] === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // For string comparisons (destination and gateway)
        if (columnIndex !== 2) {
            // Check if both are IP addresses
            const aIsIP = isIPAddress(aValue);
            const bIsIP = isIPAddress(bValue);
            
            if (aIsIP && bIsIP) {
                return compareIPAddresses(aValue, bValue, sortDirections[columnIndex]);
            }
            
            // Handle mixed IP/non-IP values
            if (aIsIP && !bIsIP) {
                // IPs come before non-IPs in ascending, after in descending
                return sortDirections[columnIndex] === 'asc' ? -1 : 1;
            }
            if (!aIsIP && bIsIP) {
                // Non-IPs come after IPs in ascending, before in descending
                return sortDirections[columnIndex] === 'asc' ? 1 : -1;
            }
            
            // Both are non-IP values, use regular string comparison
            if (sortDirections[columnIndex] === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        }
    });
    
    // Update the table
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.innerHTML = createRoutesTable(sortedRoutes);
    
    // Update arrow indicators
    updateSortArrows(columnIndex, sortDirections[columnIndex]);
}

function isIPAddress(str) {
    const parts = str.split('/')[0].split('.');
    return parts.length === 4 && parts.every(part => {
        const num = parseInt(part);
        return !isNaN(num) && num >= 0 && num <= 255;
    });
}

function ipToNumber(ipStr) {
    // Extract just the IP part (ignore subnet mask)
    const [ip] = ipStr.split('/');
    const parts = ip.split('.');
    
    // Convert IP to number using proper 32-bit unsigned calculation
    const num = (parseInt(parts[0]) * 256 * 256 * 256) + 
                (parseInt(parts[1]) * 256 * 256) + 
                (parseInt(parts[2]) * 256) + 
                parseInt(parts[3]);
    
    // Debug log
    console.log(`IP: ${ipStr} -> Number: ${num}`);
    
    return num;
}

function compareIPAddresses(a, b, direction) {
    const aNum = ipToNumber(a);
    const bNum = ipToNumber(b);
    
    console.log(`Comparing ${a} (${aNum}) vs ${b} (${bNum}) - Direction: ${direction}`);
    
    // Simple numerical comparison
    // asc (▲) = smallest to largest (0.0.0.0 first)
    // desc (▼) = largest to smallest (255.255.255.255 first)
    return direction === 'asc' 
        ? aNum - bNum  // 0.0.0.0 first
        : bNum - aNum; // 255.255.255.255 first
}

function updateSortArrows(activeColumn, direction) {
    // Reset all arrows
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.textContent = '▼';
        arrow.style.color = '#999';
    });
    
    // Update active column arrow
    const activeArrow = document.querySelector(`.sort-arrow[data-column="${activeColumn}"]`);
    if (activeArrow) {
        activeArrow.textContent = direction === 'asc' ? '▲' : '▼';
        activeArrow.style.color = '#3498db';
    }
}

// VLAN table sorting functions
function sortVlansTable(columnIndex) {
    if (!window.currentVlansData) return;
    
    // Toggle sort direction (null -> asc -> desc -> asc...)
    if (vlanSortDirections[columnIndex] === null || vlanSortDirections[columnIndex] === 'desc') {
        vlanSortDirections[columnIndex] = 'asc';
    } else {
        vlanSortDirections[columnIndex] = 'desc';
    }
    
    // Sort the data
    const sortedVlans = [...window.currentVlansData].sort((a, b) => {
        if (columnIndex === 0) { // VLAN ID column
            return compareVlanIds(a, b, vlanSortDirections[columnIndex]);
        }
        return 0;
    });
    
    // Update the table
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.innerHTML = createVlansTable(sortedVlans);
    
    // Update arrow indicators
    updateVlanSortArrows(columnIndex, vlanSortDirections[columnIndex]);
}

function compareVlanIds(a, b, direction) {
    const vlanIdA = a['vlan-id'] || a['vlan-ids'] || '';
    const vlanIdB = b['vlan-id'] || b['vlan-ids'] || '';
    
    // Handle empty values
    if (!vlanIdA && !vlanIdB) return 0;
    if (!vlanIdA) return direction === 'asc' ? 1 : -1;
    if (!vlanIdB) return direction === 'asc' ? -1 : 1;
    
    // Try to parse as numbers first
    const numA = parseInt(vlanIdA);
    const numB = parseInt(vlanIdB);
    
    // If both are valid numbers, compare numerically
    if (!isNaN(numA) && !isNaN(numB)) {
        const result = numA - numB;
        return direction === 'asc' ? result : -result;
    }
    
    // Otherwise, compare as strings
    const result = vlanIdA.localeCompare(vlanIdB);
    return direction === 'asc' ? result : -result;
}

function updateVlanSortArrows(activeColumn, direction) {
    // Reset all VLAN arrows
    document.querySelectorAll('.vlans-sortable .sort-arrow').forEach(arrow => {
        arrow.textContent = '▼';
        arrow.style.color = '#999';
    });
    
    // Update active column arrow
    const activeArrow = document.querySelector(`.vlans-sortable .sort-arrow[data-column="${activeColumn}"]`);
    if (activeArrow) {
        activeArrow.textContent = direction === 'asc' ? '▲' : '▼';
        activeArrow.style.color = '#3498db';
    }
}

// VLAN Configurator Functions
async function openVlanConfigurator() {
    if (!currentRouter) {
        showOutput('Error: Not connected to any device');
        return;
    }
    
    // Close VLAN viewer if open
    document.getElementById('resultsDisplay').style.display = 'none';
    
    // Show the panel
    document.getElementById('vlanPanel').style.display = 'block';
    
    // Clear previous values
    document.getElementById('vlanId').value = '';
    document.getElementById('vlanComment').value = '';
    
    // Load bridges and interfaces
    await Promise.all([
        loadBridgesForVlan(),
        loadInterfacesForVlan()
    ]);
}

function closeVlanPanel() {
    document.getElementById('vlanPanel').style.display = 'none';
}

async function loadBridgesForVlan() {
    const bridgeSelect = document.getElementById('vlanBridge');
    bridgeSelect.innerHTML = '<option value="">Loading bridges...</option>';
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                router: currentRouter,
                type: 'interfaces'
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // Filter for bridge interfaces
            const bridges = result.data.filter(iface => {
                const type = iface.type || '';
                return type.includes('bridge');
            });
            
            bridgeSelect.innerHTML = '<option value="">Select a bridge...</option>';
            
            bridges.forEach(bridge => {
                const option = document.createElement('option');
                option.value = bridge.name;
                option.textContent = bridge.name;
                bridgeSelect.appendChild(option);
            });
            
            // Auto-select if only one bridge
            if (bridges.length === 1) {
                bridgeSelect.value = bridges[0].name;
            }
            
            if (bridges.length === 0) {
                bridgeSelect.innerHTML = '<option value="">No bridges found</option>';
            }
        } else {
            bridgeSelect.innerHTML = '<option value="">Error loading bridges</option>';
        }
    } catch (error) {
        bridgeSelect.innerHTML = '<option value="">Error loading bridges</option>';
        console.error('Error loading bridges:', error);
    }
}

async function loadInterfacesForVlan() {
    const interfacesList = document.getElementById('vlanInterfacesList');
    interfacesList.innerHTML = '<p>Loading interfaces...</p>';
    
    try {
        // Fetch both interfaces and VLANs data
        const [interfacesResponse, vlansResponse, bridgePortsResponse] = await Promise.all([
            fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'interfaces'
                })
            }),
            fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'vlans'
                })
            }),
            fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'bridge-ports'
                })
            })
        ]);
        
        const interfacesResult = await interfacesResponse.json();
        const vlansResult = await vlansResponse.json();
        const bridgePortsResult = await bridgePortsResponse.json();
        
        if (interfacesResult.success && interfacesResult.data) {
            const vlansData = vlansResult.success ? vlansResult.data : [];
            const bridgePortsData = bridgePortsResult.success ? bridgePortsResult.data : [];
            displayInterfacesForVlan(interfacesResult.data, vlansData, bridgePortsData);
        } else {
            interfacesList.innerHTML = '<p>Error loading interfaces: ' + (interfacesResult.error || 'Unknown error') + '</p>';
        }
    } catch (error) {
        interfacesList.innerHTML = '<p>Error loading interfaces: ' + error.message + '</p>';
    }
}

function displayInterfacesForVlan(interfaces, vlansData = [], bridgePortsData = []) {
    const interfacesList = document.getElementById('vlanInterfacesList');
    
    // Create a map of interface to VLANs for quick lookup
    const interfaceVlans = {};
    
    // Create a map of interface to PVID for quick lookup
    const interfacePvids = {};
    bridgePortsData.forEach(port => {
        if (port.interface) {
            interfacePvids[port.interface] = port.pvid || '1';
        }
    });
    
    vlansData.forEach(vlan => {
        const vlanId = vlan['vlan-id'] || vlan['vlan-ids'] || '';
        
        
        // Process tagged ports
        if (vlan.tagged) {
            const taggedPorts = vlan.tagged.split(',').map(port => port.trim());
            taggedPorts.forEach(port => {
                if (!interfaceVlans[port]) interfaceVlans[port] = [];
                interfaceVlans[port].push({
                    id: vlanId,
                    type: 'tagged'
                });
            });
        }
        
        // Process untagged ports
        if (vlan.untagged) {
            const untaggedPorts = vlan.untagged.split(',').map(port => port.trim());
            untaggedPorts.forEach(port => {
                if (!interfaceVlans[port]) interfaceVlans[port] = [];
                interfaceVlans[port].push({
                    id: vlanId,
                    type: 'untagged'
                });
            });
        }
    });
    
    // Filter out virtual and non-physical interfaces, excluding VLAN interfaces
    const physicalInterfaces = interfaces.filter(iface => {
        const type = iface.type || '';
        // Include physical ports but exclude VLAN interfaces
        return (type.includes('ether') || type.includes('bridge') || 
               type.includes('sfp') || type.includes('combo') || type.includes('wlan')) &&
               !type.includes('vlan');
    });
    
    if (physicalInterfaces.length === 0) {
        interfacesList.innerHTML = '<p>No suitable interfaces found for VLAN configuration.</p>';
        return;
    }
    
    let html = '<table class="vlan-interfaces-table">';
    html += '<thead><tr>';
    html += '<th style="width: 40px;"><input type="checkbox" id="selectAllInterfaces" onchange="toggleAllInterfaces()"></th>';
    html += '<th>Interface Name</th>';
    html += '<th>Type</th>';
    html += '<th>Status</th>';
    html += '<th>PVID</th>';
    html += '<th>Current VLANs</th>';
    html += '</tr></thead><tbody>';
    
    physicalInterfaces.forEach(iface => {
        const status = iface.disabled === 'true' ? 'disabled' : 'enabled';
        const statusClass = status === 'enabled' ? 'enabled' : 'disabled';
        
        // Get VLANs for this interface
        const vlansForInterface = interfaceVlans[iface.name] || [];
        let vlanDisplay = '-';
        
        if (vlansForInterface.length > 0) {
            const vlanStrings = vlansForInterface.map(vlan => {
                const typeIndicator = vlan.type === 'tagged' ? 'T' : 'U';
                const removeButton = `<button class="remove-vlan-tag-btn" onclick="removeVlanFromInterface('${iface.name}', '${vlan.id}', '${vlan.type}')" title="Remove VLAN ${vlan.id} from ${iface.name}">R</button>`;
                return `${vlan.id}(${typeIndicator})${removeButton}`;
            });
            vlanDisplay = vlanStrings.join(' ');
        }
        
        // Get PVID for this interface
        const pvid = interfacePvids[iface.name] || '1';
        const pvidDisplay = pvid !== '1' ? 
            `${pvid} <button class="remove-vlan-tag-btn" onclick="removePvidFromInterface('${iface.name}')" title="Reset PVID to 1">R</button>` : 
            pvid;
        
        html += '<tr>';
        html += `<td><input type="checkbox" class="vlan-interface-checkbox" data-interface="${iface.name}" value="${iface.name}"></td>`;
        html += `<td><span class="interface-name">${iface.name || '-'}</span></td>`;
        html += `<td><span class="interface-type">${iface.type || '-'}</span></td>`;
        html += `<td><span class="interface-status ${statusClass}">${status}</span></td>`;
        html += `<td><span class="pvid-display">${pvidDisplay}</span></td>`;
        html += `<td><span class="vlan-assignments">${vlanDisplay}</span></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    interfacesList.innerHTML = html;
}

function toggleAllInterfaces() {
    const selectAll = document.getElementById('selectAllInterfaces');
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function selectAllPorts() {
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    document.getElementById('selectAllInterfaces').checked = true;
}

function deselectAllPorts() {
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('selectAllInterfaces').checked = false;
}

async function applyVlanToSelectedPorts() {
    const vlanId = document.getElementById('vlanId').value.trim();
    const vlanBridge = document.getElementById('vlanBridge').value;
    const vlanComment = document.getElementById('vlanComment').value.trim();
    
    if (!vlanId) {
        showAlert('Input Required', 'Please enter a VLAN ID');
        return;
    }
    
    const vlanIdNum = parseInt(vlanId);
    if (isNaN(vlanIdNum) || vlanIdNum < 1 || vlanIdNum > 4094) {
        showAlert('Invalid VLAN ID', 'VLAN ID must be between 1 and 4094');
        return;
    }
    
    if (!vlanBridge) {
        showAlert('Bridge Required', 'Please select a bridge');
        return;
    }
    
    const selectedPorts = [];
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox:checked');
    checkboxes.forEach(checkbox => {
        selectedPorts.push(checkbox.value);
    });
    
    if (selectedPorts.length === 0) {
        showAlert('Selection Required', 'Please select at least one interface');
        return;
    }
    
    // Confirm action
    const confirmMsg = `Are you sure you want to add VLAN ${vlanId} to bridge ${vlanBridge} on the following ports?\n\n${selectedPorts.join(', ')}${vlanComment ? '\n\nComment: ' + vlanComment : ''}`;
    
    showConfirmation('Confirm VLAN Configuration', confirmMsg, async function() {
        try {
            showOutput(`Applying VLAN ${vlanId} to bridge ${vlanBridge} on ports: ${selectedPorts.join(', ')}`);
            
            // First, check if VLAN already exists
            const vlansResponse = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'vlans'
                })
            });
            
            const vlansResult = await vlansResponse.json();
            let existingVlan = null;
            
            if (vlansResult.success && vlansResult.data) {
                existingVlan = vlansResult.data.find(vlan => {
                    const vlanIdFromData = vlan['vlan-id'] || vlan['vlan-ids'] || '';
                    return vlanIdFromData === vlanId && vlan.bridge === vlanBridge;
                });
            }
            
            let command;
            
            if (existingVlan) {
                // VLAN exists, add new ports to existing tagged ports
                const currentTaggedPorts = existingVlan.tagged ? existingVlan.tagged.split(',').map(p => p.trim()) : [];
                const allTaggedPorts = [...new Set([...currentTaggedPorts, ...selectedPorts])]; // Remove duplicates
                const taggedPortsString = allTaggedPorts.join(',');
                
                command = `/interface/bridge/vlan/set [find where bridge="${vlanBridge}" and vlan-ids="${vlanId}"] tagged=${taggedPortsString}`;
                
                // Handle comment logic for existing VLANs
                if (vlanComment && vlanComment.trim() !== '') {
                    // User provided a new comment - replace existing comment
                    command += ` comment="${vlanComment}"`;
                } else if (!vlanComment || vlanComment.trim() === '') {
                    // No new comment provided - preserve existing comment if it exists
                    if (existingVlan.comment && existingVlan.comment.trim() !== '') {
                        command += ` comment="${existingVlan.comment}"`;
                    }
                }
                
                showOutput(`Adding ports to existing VLAN ${vlanId} on bridge ${vlanBridge}`);
            } else {
                // VLAN doesn't exist, create new one
                const taggedPorts = selectedPorts.join(',');
                command = `/interface/bridge/vlan/add bridge=${vlanBridge} vlan-ids=${vlanId} tagged=${taggedPorts}`;
                
                if (vlanComment) {
                    command += ` comment="${vlanComment}"`;
                }
                
                showOutput(`Creating new VLAN ${vlanId} on bridge ${vlanBridge}`);
            }
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: command
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const actionType = existingVlan ? 'added to existing' : 'created and tagged on';
                showAlert('Success', `VLAN ${vlanId} has been successfully ${actionType} bridge ${vlanBridge}!\n\nPorts: ${selectedPorts.join(', ')}`);
                showOutput(`VLAN tagging completed successfully`);
                
                // Clear the form and refresh the interface list
                document.getElementById('vlanId').value = '';
                document.getElementById('vlanComment').value = '';
                deselectAllPorts();
                
                // Refresh the interface list to show updated VLAN assignments
                setTimeout(() => {
                    loadInterfacesForVlan();
                }, 1000);
            } else {
                showAlert('Error', `Failed to configure VLAN: ${result.error}`);
                showOutput(`VLAN configuration failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to configure VLAN: ${error.message}`);
            showOutput(`VLAN configuration error: ${error.message}`);
        }
    });
}

// Remove VLAN Function
function removeVlan(vlanInternalId, vlanId, bridgeName) {
    const confirmMsg = `Are you sure you want to remove VLAN ${vlanId} from bridge ${bridgeName}?\n\nThis action cannot be undone.`;
    
    showConfirmation('Confirm VLAN Removal', confirmMsg, async function() {
        try {
            showOutput(`Removing VLAN ${vlanId} from bridge ${bridgeName}...`);
            
            // Build the SSH command to remove VLAN by internal ID
            const command = `/interface/bridge/vlan/remove numbers=${vlanInternalId}`;
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: command
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Success', `VLAN ${vlanId} has been successfully removed from bridge ${bridgeName}.`);
                showOutput(`VLAN ${vlanId} removal completed successfully`);
                
                // Refresh the VLAN table to show updated data
                setTimeout(() => {
                    getData('vlans');
                }, 1000);
            } else {
                showAlert('Error', `Failed to remove VLAN: ${result.error}`);
                showOutput(`VLAN removal failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to remove VLAN: ${error.message}`);
            showOutput(`VLAN removal error: ${error.message}`);
        }
    });
}

// Remove VLAN Tag from Interface Function
function removeVlanFromInterface(interfaceName, vlanId, vlanType) {
    const typeText = vlanType === 'tagged' ? 'tagged' : 'untagged';
    const confirmMsg = `Are you sure you want to remove VLAN ${vlanId} (${typeText}) from interface ${interfaceName}?\n\nThis action cannot be undone.`;
    
    showConfirmation('Confirm VLAN Removal', confirmMsg, async function() {
        try {
            showOutput(`Removing VLAN ${vlanId} from ${interfaceName}...`);
            
            // First, get current VLAN configuration
            const vlansResponse = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'vlans'
                })
            });
            
            const vlansResult = await vlansResponse.json();
            
            if (!vlansResult.success || !vlansResult.data) {
                showAlert('Error', 'Failed to fetch current VLAN configuration');
                return;
            }
            
            // Find the VLAN that needs to be updated
            const targetVlan = vlansResult.data.find(vlan => {
                const vlanIdFromData = vlan['vlan-id'] || vlan['vlan-ids'] || '';
                return vlanIdFromData === vlanId;
            });
            
            if (!targetVlan) {
                showAlert('Error', `VLAN ${vlanId} not found`);
                return;
            }
            
            let command;
            
            if (vlanType === 'tagged') {
                // Remove from tagged ports
                const currentTaggedPorts = targetVlan.tagged ? targetVlan.tagged.split(',').map(p => p.trim()) : [];
                const updatedTaggedPorts = currentTaggedPorts.filter(port => port !== interfaceName);
                
                if (updatedTaggedPorts.length === 0 && (!targetVlan.untagged || targetVlan.untagged.trim() === '')) {
                    // No ports left, remove entire VLAN
                    command = `/interface/bridge/vlan/remove [find where vlan-ids="${vlanId}"]`;
                    showOutput(`No ports remaining, removing entire VLAN ${vlanId}`);
                } else {
                    // Update tagged ports list
                    const taggedPortsString = updatedTaggedPorts.join(',');
                    command = `/interface/bridge/vlan/set [find where vlan-ids="${vlanId}"] tagged=${taggedPortsString}`;
                }
            } else {
                // Remove from untagged ports
                const currentUntaggedPorts = targetVlan.untagged ? targetVlan.untagged.split(',').map(p => p.trim()) : [];
                const updatedUntaggedPorts = currentUntaggedPorts.filter(port => port !== interfaceName);
                
                if (updatedUntaggedPorts.length === 0 && (!targetVlan.tagged || targetVlan.tagged.trim() === '')) {
                    // No ports left, remove entire VLAN
                    command = `/interface/bridge/vlan/remove [find where vlan-ids="${vlanId}"]`;
                    showOutput(`No ports remaining, removing entire VLAN ${vlanId}`);
                } else {
                    // Update untagged ports list
                    const untaggedPortsString = updatedUntaggedPorts.join(',');
                    command = `/interface/bridge/vlan/set [find where vlan-ids="${vlanId}"] untagged=${untaggedPortsString}`;
                }
            }
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: command
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Success', `VLAN ${vlanId} has been successfully removed from interface ${interfaceName}.`);
                showOutput(`VLAN removal completed successfully`);
                
                // Refresh the interface list to show updated VLAN assignments
                setTimeout(() => {
                    loadInterfacesForVlan();
                }, 1000);
            } else {
                showAlert('Error', `Failed to remove VLAN: ${result.error}`);
                showOutput(`VLAN removal failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to remove VLAN: ${error.message}`);
            showOutput(`VLAN removal error: ${error.message}`);
        }
    });
}

// Untag VLAN from Selected Ports Function
async function untagVlanFromSelectedPorts() {
    const vlanId = document.getElementById('vlanId').value.trim();
    const vlanBridge = document.getElementById('vlanBridge').value;
    
    if (!vlanId) {
        showAlert('Input Required', 'Please enter a VLAN ID');
        return;
    }
    
    const vlanIdNum = parseInt(vlanId);
    if (isNaN(vlanIdNum) || vlanIdNum < 1 || vlanIdNum > 4094) {
        showAlert('Invalid VLAN ID', 'VLAN ID must be between 1 and 4094');
        return;
    }
    
    if (!vlanBridge) {
        showAlert('Bridge Required', 'Please select a bridge');
        return;
    }
    
    const selectedPorts = [];
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox:checked');
    checkboxes.forEach(checkbox => {
        selectedPorts.push(checkbox.value);
    });
    
    if (selectedPorts.length === 0) {
        showAlert('Selection Required', 'Please select at least one interface');
        return;
    }
    
    // Confirm action
    const confirmMsg = `Are you sure you want to untag VLAN ${vlanId} from bridge ${vlanBridge} on the following ports?\n\n${selectedPorts.join(', ')}`;
    
    showConfirmation('Confirm VLAN Untagging', confirmMsg, async function() {
        try {
            showOutput(`Untagging VLAN ${vlanId} from bridge ${vlanBridge} on ports: ${selectedPorts.join(', ')}`);
            
            // First, check if VLAN already exists
            const vlansResponse = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'vlans'
                })
            });
            
            const vlansResult = await vlansResponse.json();
            let existingVlan = null;
            
            if (vlansResult.success && vlansResult.data) {
                existingVlan = vlansResult.data.find(vlan => {
                    const vlanIdFromData = vlan['vlan-id'] || vlan['vlan-ids'] || '';
                    return vlanIdFromData === vlanId && vlan.bridge === vlanBridge;
                });
            }
            
            let command;
            if (existingVlan) {
                // VLAN exists, use set command to add untagged ports to existing configuration
                const currentUntagged = existingVlan.untagged ? existingVlan.untagged.split(',').map(p => p.trim()) : [];
                const newUntagged = [...new Set([...currentUntagged, ...selectedPorts])];
                command = `/interface/bridge/vlan/set [find where bridge="${vlanBridge}" and vlan-ids="${vlanId}"] untagged=${newUntagged.join(',')}`;
            } else {
                // VLAN doesn't exist, create new one
                command = `/interface/bridge/vlan/add bridge=${vlanBridge} vlan-ids=${vlanId} untagged=${selectedPorts.join(',')}`;
            }
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: command
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Success', `VLAN ${vlanId} has been successfully untagged from bridge ${vlanBridge}!\n\nPorts: ${selectedPorts.join(', ')}`);
                showOutput(`VLAN untagging completed successfully`);
                
                // Clear the form and refresh the interface list
                document.getElementById('vlanId').value = '';
                document.getElementById('vlanComment').value = '';
                deselectAllPorts();
                
                // Refresh the interface list to show updated VLAN assignments
                setTimeout(() => {
                    loadInterfacesForVlan();
                }, 1000);
            } else {
                showAlert('Error', `Failed to untag VLAN: ${result.error}`);
                showOutput(`VLAN untagging failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to untag VLAN: ${error.message}`);
            showOutput(`VLAN untagging error: ${error.message}`);
        }
    });
}

// Create Access Port on Selected Ports Function
async function createAccessPortOnSelectedPorts() {
    const vlanId = document.getElementById('vlanId').value.trim();
    const vlanBridge = document.getElementById('vlanBridge').value;
    
    if (!vlanId) {
        showAlert('Input Required', 'Please enter a VLAN ID');
        return;
    }
    
    const vlanIdNum = parseInt(vlanId);
    if (isNaN(vlanIdNum) || vlanIdNum < 1 || vlanIdNum > 4094) {
        showAlert('Invalid VLAN ID', 'VLAN ID must be between 1 and 4094');
        return;
    }
    
    if (!vlanBridge) {
        showAlert('Bridge Required', 'Please select a bridge');
        return;
    }
    
    const selectedPorts = [];
    const checkboxes = document.querySelectorAll('.vlan-interface-checkbox:checked');
    checkboxes.forEach(checkbox => {
        selectedPorts.push(checkbox.value);
    });
    
    if (selectedPorts.length === 0) {
        showAlert('Selection Required', 'Please select at least one interface');
        return;
    }
    
    // Confirm action
    const confirmMsg = `Are you sure you want to create access ports for VLAN ${vlanId} on the following interfaces?\n\n${selectedPorts.join(', ')}\n\nThis will set the PVID and untag the VLAN on these ports.`;
    
    showConfirmation('Confirm Access Port Creation', confirmMsg, async function() {
        try {
            showOutput(`Creating access ports for VLAN ${vlanId} on ports: ${selectedPorts.join(', ')}`);
            
            // First, check if VLAN already exists
            const vlansResponse = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    type: 'vlans'
                })
            });
            
            const vlansResult = await vlansResponse.json();
            let existingVlan = null;
            
            if (vlansResult.success && vlansResult.data) {
                existingVlan = vlansResult.data.find(vlan => {
                    const vlanIdFromData = vlan['vlan-id'] || vlan['vlan-ids'] || '';
                    return vlanIdFromData === vlanId && vlan.bridge === vlanBridge;
                });
            }
            
            // Build commands for setting PVID and untagging VLAN
            const commands = [];
            
            // Set PVID for each selected port
            selectedPorts.forEach(port => {
                commands.push(`/interface/bridge/port/set [find where interface="${port}"] pvid=${vlanId}`);
            });
            
            // Add or update untagged VLAN configuration
            if (existingVlan) {
                // VLAN exists, use set command to add untagged ports to existing configuration
                const currentUntagged = existingVlan.untagged ? existingVlan.untagged.split(',').map(p => p.trim()) : [];
                const newUntagged = [...new Set([...currentUntagged, ...selectedPorts])];
                commands.push(`/interface/bridge/vlan/set [find where bridge="${vlanBridge}" and vlan-ids="${vlanId}"] untagged=${newUntagged.join(',')}`);
            } else {
                // VLAN doesn't exist, create new one
                commands.push(`/interface/bridge/vlan/add bridge=${vlanBridge} vlan-ids=${vlanId} untagged=${selectedPorts.join(',')}`);
            }
            
            // Combine all commands
            const combinedCommand = commands.join('; ');
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: combinedCommand
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Success', `Access ports for VLAN ${vlanId} have been successfully created!\n\nPorts: ${selectedPorts.join(', ')}\nPVID set to ${vlanId} and VLAN untagged on these ports.`);
                showOutput(`Access port creation completed successfully`);
                
                // Clear the form and refresh the interface list
                document.getElementById('vlanId').value = '';
                document.getElementById('vlanComment').value = '';
                deselectAllPorts();
                
                // Refresh the interface list to show updated VLAN assignments
                setTimeout(() => {
                    loadInterfacesForVlan();
                }, 1000);
            } else {
                showAlert('Error', `Failed to create access ports: ${result.error}`);
                showOutput(`Access port creation failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to create access ports: ${error.message}`);
            showOutput(`Access port creation error: ${error.message}`);
        }
    });
}

// Remove PVID from Interface Function
async function removePvidFromInterface(interfaceName) {
    const confirmMsg = `Are you sure you want to reset the PVID for interface ${interfaceName} back to 1?\n\nThis will change the access VLAN for this port.`;
    
    showConfirmation('Confirm PVID Reset', confirmMsg, async function() {
        try {
            showOutput(`Resetting PVID for ${interfaceName} to 1...`);
            
            // Build the SSH command to reset PVID to 1
            const command = `/interface/bridge/port/set [find where interface="${interfaceName}"] pvid=1`;
            
            // Execute the command via SSH
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    router: currentRouter,
                    command: command
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Success', `PVID for interface ${interfaceName} has been successfully reset to 1!`);
                showOutput(`PVID reset completed successfully`);
                
                // Refresh the interface list to show updated PVID
                setTimeout(() => {
                    loadInterfacesForVlan();
                }, 1000);
            } else {
                showAlert('Error', `Failed to reset PVID: ${result.error}`);
                showOutput(`PVID reset failed: ${result.error}`);
            }
        } catch (error) {
            showAlert('Error', `Failed to reset PVID: ${error.message}`);
            showOutput(`PVID reset error: ${error.message}`);
        }
    });
}

// Custom Modal Functions
function showConfirmation(title, message, onConfirm) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    document.getElementById('confirmationModal').style.display = 'flex';
    
    // Set up the confirm button
    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.onclick = function() {
        closeConfirmationModal();
        if (onConfirm) onConfirm();
    };
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function showAlert(title, message) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';
}

function closeAlertModal() {
    document.getElementById('alertModal').style.display = 'none';
}

function showVlanHelper() {
    document.getElementById('vlanHelperModal').style.display = 'flex';
}

function closeVlanHelper() {
    document.getElementById('vlanHelperModal').style.display = 'none';
}
