# Guardian Relay v1.1.0 Release Notes

## 🎉 Major Release: Complete VLAN Management System

Guardian Relay v1.1.0 introduces a comprehensive VLAN management system for MikroTik switches, transforming the platform into a full-featured network management solution.

## 🌟 Headline Features

### 🔀 Complete Switch Management
- **Full VLAN Control**: Tag, untag, and manage VLANs across all switch ports
- **Access Port Creation**: One-click PVID setting and VLAN configuration
- **Visual VLAN Management**: Sortable tables showing all VLAN configurations
- **Bridge Integration**: Automatic bridge detection and port management

### 🎓 Built-in VLAN Education
- **VLAN Helper**: Interactive guide explaining tagged VLANs, untagged VLANs, and PVID concepts
- **Contextual Help**: Accessible directly from the configuration interface
- **Best Practices**: Clear explanations of when and how to use each VLAN feature

### 🎨 Enhanced User Experience
- **Device-Specific Interfaces**: Dedicated control panels for Routers, Switches, and Wireless APs
- **Professional Design**: Custom modals, device icons, and modern interface elements
- **Responsive Layout**: Optimized for both desktop and mobile management

## 🔧 Technical Highlights

### Smart VLAN Operations
- **Intelligent Command Selection**: Automatically chooses between `add` and `set` commands based on existing VLAN configuration
- **Port List Merging**: Seamlessly combines new ports with existing VLAN configurations
- **Comment Preservation**: Maintains existing VLAN comments unless explicitly replaced

### Enhanced Data Management
- **Real-Time PVID Display**: Shows Port VLAN ID for all interfaces with reset capability
- **Interface Filtering**: Automatically excludes virtual VLAN interfaces from port selection
- **Parallel Data Fetching**: Simultaneous API calls for improved performance

### Improved Architecture
- **Mutual Panel Exclusivity**: Only one VLAN panel open at a time for cleaner workflow
- **Enhanced Error Handling**: Detailed feedback with suggested resolution steps
- **Custom Modal System**: Branded confirmation dialogs replacing browser defaults

## 📊 What's New in Detail

### VLAN Viewer
- Sortable table with VLAN ID, Bridge, Tagged Ports, Untagged Ports, Status, and Comments
- Dynamic VLAN detection and status indicators
- Individual VLAN removal with confirmation
- Smart numeric sorting for VLAN IDs

### Configure VLANs
- **Tag VLAN on Ports**: Add tagged VLAN configuration to selected interfaces
- **Untag VLAN on Ports**: Configure untagged VLAN access for end devices
- **Create Access Ports**: Set PVID and configure untagged VLAN in one operation
- **PVID Management**: View and reset Port VLAN IDs with red "R" buttons
- **Bridge Auto-Detection**: Automatic population of available bridges

### Switch Controls
- Enhanced interface management with VLAN-aware filtering
- Get Interfaces functionality specific to switching operations
- Reboot and system update capabilities for switches
- Professional device icons replacing emoji representations

## 🚀 Performance & Reliability

### Backend Enhancements
- New `/interface/bridge/port/print` API endpoint for PVID data
- Improved SSH command structure and error handling
- Enhanced API responses with better error reporting

### Frontend Optimizations
- Efficient DOM manipulation and table rendering
- Smart state management for panel visibility
- Reduced redundant API calls through intelligent caching

## 🎯 User Experience Improvements

### Streamlined Workflows
- Device type selection with visual cards and icons
- Contextual help positioned where users need it most
- Clear action feedback with next-step suggestions
- Intuitive VLAN configuration flow from viewing to management

### Visual Design
- Professional MikroTik device images (RB5009, CRS328-24P, CAP-AX)
- Color-coded action buttons (Green=Tag, Red=Untag, Orange=Access, Purple=Help)
- Enhanced responsive design for mobile devices
- Improved typography and spacing throughout

## 🔄 Breaking Changes

- **Device Type Selection Required**: Users must now select device type before accessing controls
- **VLAN Panel Mutual Exclusivity**: Only one VLAN panel (View or Configure) can be open at a time

## 📈 Migration from v1.0.0

Guardian Relay v1.1.0 is fully backward compatible with existing router management features. New switch management features are additive and don't affect existing router functionality.

## 🎯 What's Next

- **Wireless AP Management**: Complete WiFi management interface
- **Advanced Switching Features**: Port mirroring, spanning tree, and advanced switching protocols
- **Network Topology Mapping**: Visual network diagrams and device discovery
- **Backup & Restore**: Configuration backup and automated restore capabilities

## 🙏 Acknowledgments

This release represents a significant evolution of Guardian Relay, transforming it from a router management tool into a comprehensive network management platform. The VLAN management system provides enterprise-grade functionality with an intuitive interface suitable for both beginners and network professionals.

---

**Download Guardian Relay v1.1.0** from [GitHub Releases](https://github.com/ISP-Academy/mikrotik-controller/releases/tag/v1.1.0)

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)