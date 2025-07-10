# Changelog

All notable changes to Guardian Relay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-07-10

### 🎯 New Features

#### **Queue Management Enhancements**
- **Pagination System**: Display 10 items per page for both DHCP leases and queues
- **Dual Navigation**: Page selectors at both top and bottom of tables
- **Show All Queues**: New button to view all queues without DHCP information
- **Independent Pagination**: Separate page tracking for DHCP and queue sections

#### **IP Blocking System**
- **BLOCK/UNBLOCK Buttons**: Quick action buttons in DHCP leases table
- **Firewall Integration**: Manages BLOCKED-CUSTOMERS address list
- **Visual Indicators**: Red for BLOCK, green for UNBLOCK buttons
- **Router Time Sync**: Uses router's local time in block comments
- **Instant Updates**: UI refreshes immediately after actions

### 🔧 Technical Improvements
- SSH-based implementation for reliable IP blocking
- Enhanced error handling for firewall operations
- Improved state management for blocked IPs
- Better pagination controls with smart page display

### 🐛 Bug Fixes
- Fixed API connectivity issues with queue operations
- Resolved timezone discrepancies in block comments
- Corrected pagination state management

## [1.2.0] - 2024-12-29

### 🎉 Major New Features

#### **WiFi Channel Planner - Standalone Network Planning Tool**
- **Complete WiFi Channel Planning Suite**: Modular tool for designing optimal channel layouts for multi-floor buildings
- **No Device Connection Required**: Standalone tool that works independently without MikroTik device login
- **Multi-Band Spectrum Support**: Full support for 2.4 GHz, 5 GHz (UNII-1/2A/2C/3), and 6 GHz (UNII-5/6/7/8) bands
- **Flexible Channel Widths**: Support for 20, 40, 80, and 160 MHz channel configurations
- **Smart AP Deployment**: Configurable density options (1 AP per 1/2/4/6/8 rooms) with intelligent positioning
- **3D Interference Avoidance**: Advanced channel assignment preventing interference horizontally, vertically, and between floors
- **Visual Floor Plan**: Interactive building visualization with color-coded channel assignments
- **Multi-Band Visualization**: Split-color room tiles showing multiple frequency bands simultaneously
- **Professional Channel Management**: Proper 2.4 GHz channel separation enforcing non-overlapping 1, 6, 11 pattern
- **Regulatory Compliance**: UNII band selection for regional spectrum requirements

### ✨ New Features

#### **Advanced Channel Planning**
- **Building Configuration**: Define custom building layouts (rooms along/across hallway, multiple floors)
- **Smart Channel Assignment**: Pattern-based 2.4 GHz assignment with interference-based fallback
- **Real-time Visualization**: Dynamic floor plan updates based on configuration changes
- **Comprehensive Statistics**: Total APs, channels used, frequency distribution, and coverage metrics
- **Export Functionality**: Generate channel plans for deployment documentation

#### **User Interface Enhancements**
- **Feature Navigation Bar**: New centralized navigation between header and device selection areas
- **Compact Channel Legend**: Scrollable legend with frequency ranges and color coding
- **Mobile-Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices
- **Interactive Elements**: Clickable room tiles, hover effects, and detailed AP information popups

### 🎨 UI/UX Improvements

#### **Navigation and Layout**
- **Streamlined Interface**: Removed redundant network planning tools tile for cleaner layout
- **Professional Navigation**: Dark navigation bar with hover animations and clear feature separation
- **Better Organization**: Modular architecture keeps WiFi planner separate from device management
- **Visual Consistency**: Unified design language across all application components

#### **WiFi Planner Interface**
- **Building Layout Helper**: Visual diagram showing room arrangement concepts
- **Sub-band Selection**: Granular control over 5 GHz UNII bands and 6 GHz spectrum allocation
- **Color-Coded Channels**: Distinct color schemes per frequency band (Red: 2.4 GHz, Blue: UNII-1, Green: UNII-2A, Purple: UNII-2C, Orange: UNII-3, Cyan: 6 GHz)
- **Frequency Range Display**: Channel legend shows both center frequency and bandwidth coverage

### 🔧 Technical Enhancements

#### **Architecture and Performance**
- **Modular Design**: WiFi planner in dedicated `/public/wifi-planner/` folder structure
- **Express.js Integration**: Seamless routing and static file serving
- **Advanced Algorithms**: Sophisticated interference scoring and channel optimization
- **State Management**: Dynamic UI updates with proper event handling

#### **Channel Planning Engine**
- **3D Interference Analysis**: Prevents same-channel conflicts across X, Y, and Z dimensions
- **Band-Specific Logic**: Tailored interference penalties for 2.4 GHz vs 5/6 GHz bands
- **Systematic Assignment**: Pattern-based approach with intelligent fallback mechanisms
- **Multi-Band Support**: Simultaneous planning across multiple frequency bands

### 📊 WiFi Planning Capabilities

#### **Spectrum Management**
- **Complete Frequency Coverage**: 2.4 GHz (3 channels), 5 GHz (28+ channels), 6 GHz (59 channels)
- **Channel Width Optimization**: Automatic channel selection based on width requirements
- **Regulatory Awareness**: UNII band compliance for different regional requirements
- **Interference Mitigation**: Smart spacing and power considerations

#### **Building Analysis**
- **Flexible Layouts**: Support for various building configurations and sizes
- **AP Positioning**: Hallway-centered placement for optimal coverage patterns
- **Floor Isolation**: Prevents vertical interference between floors
- **Density Optimization**: Configurable AP-to-room ratios for different coverage needs

### 🛠️ Technical Implementation

#### **Frontend Technologies**
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility
- **CSS Grid/Flexbox**: Modern layout techniques for responsive design
- **Canvas-like Visualization**: Dynamic building representation with scalable graphics
- **Event-Driven Architecture**: Reactive UI updates based on user configuration

#### **Backend Integration**
- **Express.js Routes**: Clean routing for standalone tool access
- **Static Asset Management**: Efficient serving of CSS, JavaScript, and image files
- **Modular Structure**: Separate concerns for maintainability and scalability

---

## [1.1.0] - 2024-12-26

### 🎉 Major New Features

#### **Complete VLAN Management System for Switches**
- **View VLANs**: Comprehensive VLAN viewer with sortable tables showing VLAN ID, bridge, tagged/untagged ports, status, and comments
- **Configure VLANs**: Full VLAN configuration interface with intelligent port management
- **PVID Management**: Port VLAN ID display and configuration for access port creation
- **VLAN Helper**: Interactive guide explaining tagged VLANs, untagged VLANs, and PVID concepts

#### **Multi-Device Type Support**
- **Device Classification**: Added support for Routers, Switches, and Wireless APs with dedicated control panels
- **Device-Specific Features**: Tailored functionality for each device type with appropriate icons and controls
- **Visual Device Cards**: Enhanced device selection with MikroTik device images (RB5009, CRS328-24P, CAP-AX)

### ✨ New Features

#### **Switch Controls**
- **VLAN Tagging**: Tag VLANs on selected ports with intelligent existing VLAN detection
- **VLAN Untagging**: Add untagged VLAN configuration to ports
- **Access Port Creation**: Automated PVID setting and VLAN untagging for access ports
- **Interface Management**: Get interfaces with VLAN-aware filtering (excludes VLAN interfaces)
- **Bridge Port Integration**: Automatic bridge detection and PVID display
- **Individual VLAN Removal**: Remove specific VLAN tags from interfaces with confirmation
- **PVID Reset**: Reset port VLAN ID back to default (VLAN 1)

#### **Enhanced VLAN Features**
- **Smart Command Selection**: Automatically uses `/interface/bridge/vlan/add` vs `/interface/bridge/vlan/set` based on VLAN existence
- **Port List Merging**: Intelligently combines existing and new port lists when adding to VLANs
- **Comment Preservation**: Maintains existing VLAN comments when adding ports unless explicitly replaced
- **VLAN Sorting**: Clickable column sorting with smart numeric/string handling for VLAN IDs
- **Dynamic VLAN Detection**: Real-time indication of dynamic vs static VLANs
- **Bridge Auto-population**: Automatic bridge interface detection and selection

#### **User Interface Improvements**
- **Mutual Exclusivity**: View VLANs and Configure VLANs panels are mutually exclusive (only one open at a time)
- **Scrollable Interface Tables**: Large, scrollable interface selection with fixed action buttons
- **Custom Modal System**: Replaced browser alerts/confirms with branded custom modals
- **Enhanced Layout**: Improved responsive design with better mobile support
- **VLAN Helper Integration**: Contextually placed help button in Configure VLANs header

#### **Device Management Enhancements**
- **Reboot Functionality**: Added reboot capabilities for all device types (Routers, Switches, Wireless APs)
- **System Updates**: RouterOS update checking and firmware management for all device types
- **Device Time Display**: Real-time device clock display for scheduled operations
- **Enhanced Status Display**: Improved system information cards with better visual hierarchy

### 🔧 Technical Improvements

#### **Backend Enhancements**
- **Bridge Port API**: New `/interface/bridge/port/print` endpoint for PVID data retrieval
- **SSH Command Optimization**: Enhanced command structure for VLAN operations
- **Error Handling**: Improved error messages and user feedback
- **API Expansion**: Extended data types for comprehensive device management

#### **Frontend Architecture**
- **Modular VLAN Functions**: Separated VLAN operations into dedicated, reusable functions
- **Real-time Data Sync**: Interface and VLAN data synchronization with automatic refresh
- **Performance Optimization**: Efficient data processing and DOM manipulation
- **State Management**: Better handling of device connection states and panel visibility

### 🎨 UI/UX Improvements

#### **Visual Design**
- **Device Icons**: Replaced emoji icons with actual MikroTik device images
- **Color-Coded Actions**: Distinct colors for different VLAN operations (Tag=Green, Untag=Red, Access=Orange, Help=Purple)
- **Professional Modals**: Custom-designed confirmation dialogs with Network Guardian branding
- **Improved Typography**: Better font hierarchy and spacing throughout the interface

#### **User Experience**
- **Contextual Help**: VLAN Helper accessible directly from configuration interface
- **Clear Action Feedback**: Detailed success/error messages with suggested next steps
- **Intuitive Workflows**: Logical flow from VLAN viewing to configuration to management
- **Responsive Layout**: Optimized for both desktop and mobile use

### 🛠️ Bug Fixes
- **VLAN Interface Filtering**: Fixed VLAN interfaces appearing in port selection tables
- **PVID Data Accuracy**: Resolved PVID display showing incorrect values
- **Panel Overflow**: Fixed scrolling issues in VLAN configuration panels
- **Command Syntax**: Corrected escaped character issues in JavaScript
- **Server Stability**: Improved Node.js server startup and background execution

### 📚 Documentation
- **VLAN Helper Guide**: Comprehensive in-app documentation for VLAN concepts
- **Technical Implementation**: Detailed SSH command references and API documentation
- **User Workflows**: Step-by-step guides for common VLAN configuration tasks

### 🔄 Breaking Changes
- **Device Type Selection**: Users must now select device type (Router/Switch/Wireless AP) before accessing controls
- **VLAN Panel Behavior**: Only one VLAN panel (View or Configure) can be open at a time

### 🚀 Performance
- **Parallel API Calls**: Simultaneous data fetching for interfaces, VLANs, and bridge ports
- **Efficient Rendering**: Optimized table generation and DOM updates
- **Smart Caching**: Reduced redundant API calls through intelligent state management

---

## [1.0.0] - 2024-11-XX

### 🎉 Initial Release
- **Router Management**: Basic MikroTik router connection and management
- **Interface Monitoring**: Network interface status and configuration viewing
- **DHCP Management**: DHCP lease monitoring and management
- **Queue Management**: CAKE queue configuration and traffic shaping
- **System Information**: Real-time system status and resource monitoring
- **Traffic Monitoring**: Network traffic visualization and monitoring
- **System Updates**: RouterOS and RouterBOARD firmware management

---

**Legend:**
- 🎉 Major Features
- ✨ New Features  
- 🔧 Technical Improvements
- 🎨 UI/UX Improvements
- 🛠️ Bug Fixes
- 📚 Documentation
- 🔄 Breaking Changes
- 🚀 Performance