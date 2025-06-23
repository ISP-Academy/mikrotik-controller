# Guardian Relay v1.1.0

A comprehensive network management platform for MikroTik devices with full multi-device support.

## Supported Devices
- **🔌 Routers**: Complete router management, queues, updates, and routing
- **🔀 Switches**: Full VLAN configuration, port management, and switching controls
- **📡 Wireless APs**: WiFi management and client monitoring (coming soon)

## 🎉 New in v1.1.0 - Complete VLAN Management
- **View VLANs**: Comprehensive VLAN viewer with sortable tables
- **Configure VLANs**: Full VLAN tagging, untagging, and access port creation
- **PVID Management**: Port VLAN ID configuration and display
- **VLAN Helper**: Interactive guide for understanding VLAN concepts
- **Smart Interface Detection**: Automatic filtering of physical vs virtual interfaces
- **Bridge Integration**: Automatic bridge detection and port management

## Key Features
- **🎯 Multi-Device Support**: Device-specific control panels with tailored functionality
- **🔧 Advanced VLAN Management**: Complete Layer 2 switching configuration
- **📊 Queue Management**: CAKE bandwidth control and traffic shaping  
- **🔄 System Management**: RouterOS updates, firmware upgrades, and scheduled reboots
- **📈 Real-Time Monitoring**: Traffic graphs and system resource monitoring
- **🎨 Modern Interface**: Custom modals, device icons, and responsive design

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