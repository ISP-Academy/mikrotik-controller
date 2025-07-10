// Network Topology Visualizer
let currentDevice = null;
let nodes = new Map();
let connections = [];
let selectedNode = null;
let canvasOffset = { x: 2500, y: 2500 };
let zoomScale = 1;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };

// DOM Elements
const deviceSelection = document.getElementById('deviceSelection');
const topologySection = document.getElementById('topologySection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const topologyCanvas = document.getElementById('topologyCanvas');
const topologyContainer = document.getElementById('topologyContainer');
const connectedDevice = document.getElementById('connectedDevice');
const deviceCount = document.getElementById('deviceCount');
const deviceDetails = document.getElementById('deviceDetails');
const deviceDetailsContent = document.getElementById('deviceDetailsContent');
const zoomLevel = document.getElementById('zoomLevel');

// Buttons
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const refreshBtn = document.getElementById('refreshBtn');
const autoLayoutBtn = document.getElementById('autoLayoutBtn');
const exportBtn = document.getElementById('exportBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');

// Input fields
const routerIP = document.getElementById('routerIP');
const username = document.getElementById('username');
const password = document.getElementById('password');
const sshPort = document.getElementById('sshPort');
const apiPort = document.getElementById('apiPort');
const hopLimit = document.getElementById('hopLimit');
const recentSelect = document.getElementById('recentSelect');
const connectionStatus = document.getElementById('connectionStatus');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRecentDevices();
    setupEventListeners();
    centerCanvas();
});

// Load recent devices from localStorage
function loadRecentDevices() {
    const recentDevices = JSON.parse(localStorage.getItem('recentTopologyDevices') || '[]');
    if (recentDevices.length > 0) {
        document.getElementById('recentRouters').style.display = 'block';
        recentSelect.innerHTML = '<option value="">Select a recent device...</option>';
        recentDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = JSON.stringify(device);
            option.textContent = `${device.ip} - ${device.name || 'Unknown'}`;
            recentSelect.appendChild(option);
        });
    }
}

// Save device to recent list
function saveRecentDevice(ip, name) {
    let recentDevices = JSON.parse(localStorage.getItem('recentTopologyDevices') || '[]');
    recentDevices = recentDevices.filter(d => d.ip !== ip);
    recentDevices.unshift({ ip, name, timestamp: Date.now() });
    recentDevices = recentDevices.slice(0, 10); // Keep only last 10
    localStorage.setItem('recentTopologyDevices', JSON.stringify(recentDevices));
}

// Setup event listeners
function setupEventListeners() {
    connectBtn.addEventListener('click', connectToDevice);
    disconnectBtn.addEventListener('click', disconnect);
    refreshBtn.addEventListener('click', refreshTopology);
    autoLayoutBtn.addEventListener('click', autoLayout);
    exportBtn.addEventListener('click', exportTopology);
    zoomInBtn.addEventListener('click', () => zoom(0.1));
    zoomOutBtn.addEventListener('click', () => zoom(-0.1));

    recentSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            const device = JSON.parse(e.target.value);
            routerIP.value = device.ip;
        }
    });

    // Canvas dragging
    topologyCanvas.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                zoom(0.1);
            } else if (e.key === '-') {
                e.preventDefault();
                zoom(-0.1);
            } else if (e.key === '0') {
                e.preventDefault();
                resetZoom();
            }
        }
    });
}

// Connect to device
async function connectToDevice() {
    const ip = routerIP.value.trim();
    const user = username.value.trim();
    const pass = password.value.trim();
    const port = sshPort.value || '22';
    const apiPortValue = apiPort.value || '8728';

    if (!ip || !user || !pass) {
        showError('Please fill in all connection fields');
        return;
    }

    showLoading();
    hideError();

    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, username: user, password: pass, sshPort: port, apiPort: apiPortValue })
        });

        const data = await response.json();

        if (data.success) {
            currentDevice = { ip, username: user, password: pass, sshPort: port, apiPort: apiPortValue, name: data.deviceName };
            saveRecentDevice(ip, data.deviceName);
            connectedDevice.textContent = `Connected to: ${data.deviceName} (${ip})`;
            
            deviceSelection.style.display = 'none';
            topologySection.style.display = 'flex';
            
            await discoverTopology();
        } else {
            showError(data.error || 'Failed to connect to device');
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Discover network topology using RoMON
async function discoverTopology() {
    showLoading();
    hideError();

    try {
        console.log('Calling RoMON discovery with:', currentDevice);
        const response = await fetch('/api/romon-discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentDevice)
        });

        console.log('RoMON Response status:', response.status);
        console.log('RoMON Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('RoMON Response length:', responseText.length);
        console.log('RoMON Response preview (first 500 chars):', responseText.substring(0, 500));
        console.log('RoMON Response preview (last 500 chars):', responseText.substring(responseText.length - 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ JSON parsed successfully');
            console.log('Discovery response data:', data);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            showError('Failed to parse server response');
            return;
        }

        if (data.success) {
            console.log('✅ Data success is true');
            console.log('Topology data from server:', data.topology);
            
            try {
                console.log('📊 Starting processTopologyData...');
                processTopologyData(data.topology);
                console.log('✅ processTopologyData completed');
                
                console.log('🎨 Starting renderTopology...');
                renderTopology();
                console.log('✅ renderTopology completed');
            } catch (processError) {
                console.error('❌ Error in data processing:', processError);
                showError('Error processing topology data: ' + processError.message);
                return;
            }
            
            // Force add a visible test node at a known position to debug canvas rendering
            console.log('Adding test node for debugging...');
            const testElement = document.createElement('div');
            testElement.className = 'network-node router';
            testElement.style.position = 'absolute';
            testElement.style.left = '50px';
            testElement.style.top = '50px';
            testElement.style.backgroundColor = 'red';
            testElement.style.zIndex = '1000';
            testElement.style.width = '200px';
            testElement.style.height = '100px';
            testElement.innerHTML = '<div style="color: white; font-weight: bold;">TEST NODE - VISIBLE</div>';
            topologyCanvas.appendChild(testElement);
            console.log('Test node added, canvas children now:', topologyCanvas.children.length);
            
            // Also check canvas dimensions and transform
            console.log('Canvas computed style:', window.getComputedStyle(topologyCanvas));
            console.log('Canvas transform:', topologyCanvas.style.transform);
            console.log('Container dimensions:', topologyContainer.getBoundingClientRect());
        } else {
            showError(data.error || 'Failed to discover topology');
        }
    } catch (error) {
        console.error('Discovery error details:', error);
        if (error.message.includes('Unexpected token')) {
            showError('Server returned HTML instead of JSON. Check browser console for details.');
        } else {
            showError('Discovery error: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

// Process topology data from RoMON
function processTopologyData(topology) {
    nodes.clear();
    connections = [];
    
    const maxHops = parseInt(hopLimit.value) || 3;
    // Convert hop limit to cost (each hop is 200 cost units based on the data)
    const maxCost = maxHops * 200;

    // Add the root device
    const rootNode = {
        id: currentDevice.ip,
        ip: currentDevice.ip,
        name: currentDevice.name || 'Root Device',
        type: 'router',
        x: 2500,
        y: 2500,
        isRoot: true,
        level: 0
    };
    nodes.set(rootNode.id, rootNode);

    // Process discovered devices and filter by hop limit
    if (topology && topology.devices && topology.devices.length > 0) {
        console.log('Processing', topology.devices.length, 'discovered devices');
        console.log('First few devices:', topology.devices.slice(0, 5));
        
        // Filter devices by hop limit (not cost, since cost calculation varies)
        const filteredDevices = topology.devices.filter(device => {
            const deviceHops = device.hops || 1;
            console.log(`Device ${device.identity || device.address}: hops=${deviceHops}, maxHops=${maxHops}`);
            return deviceHops <= maxHops;
        });
        
        console.log('Filtered to', filteredDevices.length, 'devices within', maxHops, 'hops (cost limit:', maxCost, ')');
        
        // Group devices by their cost (hop level)
        const devicesByLevel = {};
        filteredDevices.forEach(device => {
            const level = Math.ceil((device.cost || 100) / 100); // Convert cost to hop level
            if (!devicesByLevel[level]) {
                devicesByLevel[level] = [];
            }
            devicesByLevel[level].push(device);
        });
        
        console.log('Devices by level:', devicesByLevel);
        
        // Arrange devices in tree levels
        Object.keys(devicesByLevel).forEach(level => {
            const levelDevices = devicesByLevel[level];
            const levelNum = parseInt(level);
            const radius = 200 + (levelNum * 150); // Increase radius for each level
            
            levelDevices.forEach((device, index) => {
                const angle = (Math.PI * 2 * index) / levelDevices.length;
                
                const node = {
                    id: device.address || device.mac || device.ip || `device-${levelNum}-${index}`,
                    ip: device.ip,
                    mac: device.address || device.mac,
                    address: device.address,
                    name: device.identity || device.name || device.address || 'Unknown Device',
                    type: detectDeviceType(device),
                    cost: device.cost,
                    hops: device.hops,
                    path: device.path || [],
                    platform: device.platform,
                    version: device.version,
                    level: levelNum,
                    x: rootNode.x + Math.cos(angle) * radius,
                    y: rootNode.y + Math.sin(angle) * radius
                };
                
                console.log('Adding node:', node);
                nodes.set(node.id, node);
            });
        });
        
        // Now create connections based on path information
        console.log('Creating connections based on paths...');
        filteredDevices.forEach(device => {
            if (device.path && device.path.length > 0) {
                // For each device, connect it to its immediate parent in the path
                const deviceMac = device.address;
                const pathLength = device.path.length;
                
                if (pathLength === 1) {
                    // Device is directly connected to root (path only contains its own MAC)
                    connections.push({
                        from: rootNode.id,
                        to: deviceMac,
                        type: 'wired',
                        cost: device.cost
                    });
                    console.log(`Connected ${device.identity} directly to root`);
                } else if (pathLength > 1) {
                    // Device is connected through intermediate devices
                    // Connect it to the previous device in the path
                    const parentMac = device.path[pathLength - 2]; // Second to last MAC is the parent
                    
                    // Check if connection already exists
                    const connectionExists = connections.some(conn => 
                        (conn.from === parentMac && conn.to === deviceMac) ||
                        (conn.from === deviceMac && conn.to === parentMac)
                    );
                    
                    if (!connectionExists) {
                        connections.push({
                            from: parentMac,
                            to: deviceMac,
                            type: 'wired',
                            cost: 200 // Each hop is 200 cost
                        });
                        console.log(`Connected ${device.identity} to parent ${parentMac}`);
                    }
                }
            }
        });
        
    } else {
        console.log('No devices found in topology data or empty devices array');
        if (topology) {
            console.log('Topology keys:', Object.keys(topology));
        }
    }
    
    const discoveredDeviceCount = nodes.size - 1; // Exclude root device
    console.log(`Processed ${discoveredDeviceCount} devices within ${maxHops} hops`);
    console.log('Nodes:', Array.from(nodes.values()));
    console.log('Connections:', connections);
    
    // Update device count display
    updateDeviceCount(discoveredDeviceCount, topology.devices ? topology.devices.length : 0);
}

// Detect device type based on properties
function detectDeviceType(device) {
    if (device.type) return device.type;
    if (device.platform) {
        const platform = device.platform.toLowerCase();
        if (platform.includes('router') || platform.includes('ccr')) return 'router';
        if (platform.includes('switch') || platform.includes('css')) return 'switch';
        if (platform.includes('ap') || platform.includes('cap')) return 'ap';
    }
    return 'unknown';
}

// Render the topology
function renderTopology() {
    console.log('Rendering topology with', nodes.size, 'nodes and', connections.length, 'connections');
    topologyCanvas.innerHTML = '';
    
    // Draw connections first
    connections.forEach(conn => {
        drawConnection(conn);
    });
    
    // Draw nodes
    let nodeCount = 0;
    nodes.forEach(node => {
        console.log('Drawing node:', node.name, 'at position', node.x, node.y);
        drawNode(node);
        nodeCount++;
    });
    
    console.log('Topology rendered with', nodeCount, 'nodes drawn');
    
    // Center the view on the root node after rendering
    if (nodes.size > 0) {
        centerCanvas();
    }
}

// Draw a node
function drawNode(node) {
    console.log('Creating node element for:', node.name);
    const nodeElement = document.createElement('div');
    nodeElement.className = `network-node ${node.type}`;
    nodeElement.style.left = `${node.x - 60}px`;
    nodeElement.style.top = `${node.y - 40}px`;
    
    const icon = getNodeIcon(node.type);
    
    nodeElement.innerHTML = `
        <div class="node-icon">${icon}</div>
        <div class="node-name">${node.name}</div>
        <div class="node-ip">${node.ip || node.mac || 'N/A'}</div>
        ${node.cost ? `<div class="node-info">Cost: ${node.cost}</div>` : ''}
    `;
    
    nodeElement.addEventListener('click', () => selectNode(node));
    nodeElement.addEventListener('mousedown', (e) => startNodeDrag(e, node));
    
    console.log('Appending node element to canvas');
    topologyCanvas.appendChild(nodeElement);
    node.element = nodeElement;
    console.log('Node element appended, canvas children:', topologyCanvas.children.length);
}

// Get icon for node type
function getNodeIcon(type) {
    const icons = {
        router: '🔧',
        switch: '🔌',
        ap: '📡',
        unknown: '❓'
    };
    return icons[type] || icons.unknown;
}

// Draw connection between nodes
function drawConnection(conn) {
    const fromNode = nodes.get(conn.from);
    const toNode = nodes.get(conn.to);
    
    if (!fromNode || !toNode) return;
    
    const line = document.createElement('div');
    line.className = `connection-line ${conn.type === 'wireless' ? 'wireless' : ''}`;
    
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    line.style.width = `${distance}px`;
    line.style.left = `${fromNode.x}px`;
    line.style.top = `${fromNode.y}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    topologyCanvas.appendChild(line);
}

// Select a node
function selectNode(node) {
    if (selectedNode && selectedNode.element) {
        selectedNode.element.classList.remove('selected');
    }
    
    selectedNode = node;
    node.element.classList.add('selected');
    
    showDeviceDetails(node);
}

// Show device details
function showDeviceDetails(node) {
    deviceDetails.style.display = 'block';
    
    const details = [
        { label: 'Name', value: node.name },
        { label: 'IP Address', value: node.ip || 'N/A' },
        { label: 'MAC Address', value: node.address || node.mac || 'N/A' },
        { label: 'Type', value: node.type },
        { label: 'Platform', value: node.platform || 'N/A' },
        { label: 'Version', value: node.version || 'N/A' },
        { label: 'Hops', value: node.hops || 'N/A' },
        { label: 'Distance (Cost)', value: node.cost || 'N/A' },
        { label: 'Path Length', value: node.path ? node.path.length : 'N/A' },
        { label: 'Path', value: node.path && node.path.length > 0 ? node.path.join(' → ') : 'N/A' }
    ];
    
    deviceDetailsContent.innerHTML = details.map(detail => `
        <div class="detail-row">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `).join('');
}

// Canvas navigation
function startDrag(e) {
    if (e.target === topologyCanvas) {
        isDragging = true;
        dragStart.x = e.clientX - dragOffset.x;
        dragStart.y = e.clientY - dragOffset.y;
        topologyCanvas.classList.add('dragging');
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        dragOffset.x = e.clientX - dragStart.x;
        dragOffset.y = e.clientY - dragStart.y;
        updateCanvasTransform();
    }
}

function endDrag() {
    isDragging = false;
    topologyCanvas.classList.remove('dragging');
}

// Node dragging
let isDraggingNode = false;
let draggedNode = null;
let nodeStartPos = { x: 0, y: 0 };

function startNodeDrag(e, node) {
    e.stopPropagation();
    isDraggingNode = true;
    draggedNode = node;
    nodeStartPos = { x: e.clientX - node.x, y: e.clientY - node.y };
    
    const moveNode = (e) => {
        if (isDraggingNode && draggedNode) {
            draggedNode.x = (e.clientX - nodeStartPos.x - dragOffset.x) / zoomScale;
            draggedNode.y = (e.clientY - nodeStartPos.y - dragOffset.y) / zoomScale;
            renderTopology();
        }
    };
    
    const stopNodeDrag = () => {
        isDraggingNode = false;
        draggedNode = null;
        document.removeEventListener('mousemove', moveNode);
        document.removeEventListener('mouseup', stopNodeDrag);
    };
    
    document.addEventListener('mousemove', moveNode);
    document.addEventListener('mouseup', stopNodeDrag);
}

// Zoom functions
function zoom(delta) {
    zoomScale = Math.max(0.1, Math.min(3, zoomScale + delta));
    zoomLevel.textContent = Math.round(zoomScale * 100) + '%';
    updateCanvasTransform();
}

function resetZoom() {
    zoomScale = 1;
    zoomLevel.textContent = '100%';
    updateCanvasTransform();
}

function updateCanvasTransform() {
    topologyCanvas.style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoomScale})`;
}

function centerCanvas() {
    // Reset zoom to 1 and center the canvas
    zoomScale = 1;
    zoomLevel.textContent = '100%';
    
    const containerRect = topologyContainer.getBoundingClientRect();
    // Center the canvas so that position 2500,2500 (our root node) is in the middle
    dragOffset.x = containerRect.width / 2 - 2500;
    dragOffset.y = containerRect.height / 2 - 2500;
    console.log('Centering canvas with container size:', containerRect.width, 'x', containerRect.height);
    console.log('Setting drag offset to:', dragOffset);
    updateCanvasTransform();
}

// Auto layout
function autoLayout() {
    const centerX = 2500;
    const centerY = 2500;
    
    // Group nodes by level
    const nodesByLevel = {};
    nodes.forEach((node, id) => {
        const level = node.level || 0;
        if (!nodesByLevel[level]) {
            nodesByLevel[level] = [];
        }
        nodesByLevel[level].push(node);
    });
    
    // Arrange each level in concentric circles
    Object.keys(nodesByLevel).forEach(level => {
        const levelNodes = nodesByLevel[level];
        const levelNum = parseInt(level);
        
        if (levelNum === 0) {
            // Root node stays at center
            levelNodes[0].x = centerX;
            levelNodes[0].y = centerY;
        } else {
            // Arrange other levels in circles
            const radius = 200 + (levelNum * 180);
            levelNodes.forEach((node, index) => {
                const angle = (Math.PI * 2 * index) / levelNodes.length;
                node.x = centerX + Math.cos(angle) * radius;
                node.y = centerY + Math.sin(angle) * radius;
            });
        }
    });
    
    renderTopology();
}

// Export topology
function exportTopology() {
    const exportData = {
        timestamp: new Date().toISOString(),
        rootDevice: currentDevice,
        nodes: Array.from(nodes.values()),
        connections: connections
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-topology-${currentDevice.ip}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Refresh topology
function refreshTopology() {
    console.log('Refreshing topology...');
    discoverTopology();
}

// Disconnect
function disconnect() {
    currentDevice = null;
    nodes.clear();
    connections = [];
    selectedNode = null;
    
    deviceSelection.style.display = 'block';
    topologySection.style.display = 'none';
    deviceDetails.style.display = 'none';
    deviceCount.style.display = 'none';
    
    routerIP.value = '';
    username.value = '';
    password.value = '';
}

// Update device count display
function updateDeviceCount(visibleCount, totalCount) {
    if (totalCount > 0) {
        deviceCount.textContent = `Found ${totalCount} devices (${visibleCount} visible)`;
        deviceCount.style.display = 'inline-block';
    } else {
        deviceCount.textContent = '';
        deviceCount.style.display = 'none';
    }
}

// Helper functions
function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}