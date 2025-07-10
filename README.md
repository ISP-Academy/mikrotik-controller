# Guardian Relay v1.3.0

## Features Overview
- **📡 WiFi Channel Planner**: Standalone tool for designing optimal channel layouts
- **🔌 Device Management**: Complete MikroTik router, switch, and wireless AP support
- **🔧 Advanced VLAN Configuration**: Professional Layer 2 switching management
- **📊 Traffic & Queue Management**: Bandwidth control with pagination and IP blocking
- **🎯 Multi-Device Support**: Device-specific control panels with tailored functionality

## 🎉 New in v1.3.0 - Enhanced Queue Management & IP Blocking

### **Queue Management Improvements**
- **Pagination System**: Clean 10-items-per-page display for DHCP leases and queues
- **Show All Queues**: Dedicated button to view all queues without DHCP information
- **Smart Navigation**: Page selectors at both top and bottom with intelligent page display

### **IP Blocking System**
- **Quick Actions**: BLOCK/UNBLOCK buttons directly in DHCP leases table
- **Firewall Integration**: Manages BLOCKED-CUSTOMERS address list automatically
- **Visual Feedback**: Red BLOCK buttons, green UNBLOCK buttons
- **Router Time Sync**: Block comments use router's local time, not server UTC

## Previous Release: v1.2.0 - WiFi Channel Planner

### **Standalone Network Planning Tool**
- **No Device Connection Required**: Works independently for planning new deployments
- **Multi-Floor Building Support**: Design channel layouts for complex building structures
- **Complete Spectrum Coverage**: 2.4 GHz, 5 GHz (UNII-1/2A/2C/3), and 6 GHz (UNII-5/6/7/8)
- **Flexible Channel Widths**: Support for 20, 40, 80, and 160 MHz configurations
- **3D Interference Avoidance**: Prevents conflicts horizontally, vertically, and between floors

### **Smart AP Deployment**
- **Configurable Density**: 1 AP per 1/2/4/6/8 rooms with intelligent positioning
- **Hallway Placement**: Professional AP positioning for optimal coverage
- **Visual Floor Plans**: Interactive building visualization with color-coded channels
- **Multi-Band Support**: Simultaneous planning across multiple frequency bands

### **Professional Channel Management**
- **Pattern-Based Assignment**: Systematic 2.4 GHz channel distribution (1, 6, 11)
- **Regulatory Compliance**: UNII band selection for regional requirements
- **Export Functionality**: Generate channel plans for deployment documentation
- **Real-Time Visualization**: Dynamic updates based on configuration changes

## Supported Devices
- **🔌 Routers**: Complete router management, queues, updates, and routing
- **🔀 Switches**: Full VLAN configuration, port management, and switching controls
- **📡 Wireless APs**: WiFi management and client monitoring (coming soon)

## Key Features

### **📡 WiFi Channel Planner**
- **Building Configuration**: Define rooms along/across hallway and number of floors
- **Channel Assignment**: Smart algorithms preventing interference across all dimensions
- **Multi-Band Visualization**: Split-color tiles showing multiple frequency bands
- **Compact Legend**: Scrollable channel list with frequency ranges
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile planning

### **🔧 Device Management**
- **Advanced VLAN Management**: Complete Layer 2 switching configuration
- **Queue Management**: CAKE bandwidth control and traffic shaping  
- **System Management**: RouterOS updates, firmware upgrades, and scheduled reboots
- **Real-Time Monitoring**: Traffic graphs and system resource monitoring
- **Modern Interface**: Feature navigation bar and responsive design

## Quick Install

### Prerequisites
- Docker and Docker Compose installed
- Access to your local network

### Installation

1. **Download the installer:**
   ```bash
   curl -o install.sh https://raw.githubusercontent.com/ISP-Academy/mikrotik-controller/main/install.sh
   chmod +x install.sh
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```

3. **Access the interface:**
   Open your browser to: `http://localhost:3333`

### Updates

To update to the latest version:
```bash
curl -o update.sh https://raw.githubusercontent.com/ISP-Academy/mikrotik-controller/main/update.sh
chmod +x update.sh
./update.sh
```

### Uninstall

```bash
curl -o uninstall.sh https://raw.githubusercontent.com/ISP-Academy/mikrotik-controller/main/uninstall.sh
chmod +x uninstall.sh
./uninstall.sh
```

## Manual Installation

If you prefer manual installation:

```bash
# Download docker-compose.yml
curl -o docker-compose.yml https://raw.githubusercontent.com/ISP-Academy/mikrotik-controller/main/docker-compose.yml

# Start the service
docker-compose up -d

# Access at http://localhost:3333
```

## Detailed Features

### 🔌 Router Management
- **System Monitoring**: Real-time CPU, memory, uptime, and platform information
- **Queue Management**: CAKE queue creation, modification, and bandwidth control
- **Software Updates**: RouterOS update checking and installation
- **Firmware Management**: RouterBOARD firmware upgrades
- **Traffic Monitoring**: Real-time WAN traffic graphs and statistics
- **Interface Management**: Network interface monitoring and configuration

### 🔀 Switch Management
- **VLAN Viewer**: Sortable table showing all VLANs with tagged/untagged ports
- **VLAN Configuration**: Tag/untag VLANs on physical ports with intelligent detection
- **Access Port Creation**: Automated PVID setting and VLAN untagging
- **Bridge Integration**: Automatic bridge discovery and port management
- **PVID Management**: Port VLAN ID display and reset functionality
- **Interface Filtering**: Smart filtering of physical vs virtual interfaces

### 📡 Wireless AP Management (Coming Soon)
- **SSID Management**: Configure and monitor wireless networks
- **Client Monitoring**: View connected devices and signal strength
- **Security Configuration**: WPA/WPA2/WPA3 settings and management

### 🎨 User Experience
- **Device-Specific Controls**: Tailored interfaces for each device type
- **Custom Modals**: Professional confirmation dialogs with Network Guardian branding
- **Responsive Design**: Optimized for desktop and mobile devices
- **VLAN Helper**: Interactive guide explaining VLAN concepts and best practices
- **Real-Time Updates**: Automatic refresh of interface and VLAN data

## Configuration

The application runs on port 3333 by default. To change this, edit the docker-compose.yml file:

```yaml
ports:
  - "YOUR_PORT:3333"
```

## Support

For issues and support, please visit: [GitHub Issues](https://github.com/ISP-Academy/mikrotik-controller/issues)

## License

MIT License - See LICENSE file for details