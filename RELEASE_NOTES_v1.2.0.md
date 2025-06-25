# Guardian Relay v1.2.0 Release Notes

## 🎉 Major New Feature: WiFi Channel Planner

Guardian Relay v1.2.0 introduces a powerful new **WiFi Channel Planner** - a standalone network planning tool that works independently of device connections. This comprehensive tool enables professional WiFi deployment planning for multi-floor buildings with advanced interference avoidance.

---

## 🌟 What's New

### 📡 Complete WiFi Channel Planning Suite
- **No Device Required**: Plan WiFi deployments without connecting to any MikroTik device
- **Multi-Floor Support**: Design channel layouts for complex building structures (up to 10 floors)
- **Complete Spectrum Coverage**: 2.4 GHz, 5 GHz (UNII-1/2A/2C/3), and 6 GHz (UNII-5/6/7/8) bands
- **Flexible Channel Widths**: Support for 20, 40, 80, and 160 MHz configurations

### 🎯 Smart AP Deployment
- **Configurable Density**: Choose 1 AP per 1, 2, 4, 6, or 8 rooms
- **Professional Positioning**: APs positioned in hallways for optimal coverage
- **Visual Building Layout**: Interactive floor plans with color-coded channel assignments
- **Multi-Band Visualization**: Split-color tiles showing multiple frequency bands simultaneously

### 🧠 Advanced Channel Management
- **3D Interference Avoidance**: Prevents conflicts horizontally, vertically, and between floors
- **Pattern-Based 2.4 GHz**: Systematic channel distribution using non-overlapping 1, 6, 11 pattern
- **Regulatory Compliance**: UNII band selection for regional spectrum requirements
- **Real-Time Updates**: Dynamic visualization based on configuration changes

### 🎨 Enhanced User Interface
- **Feature Navigation Bar**: New centralized navigation between tools
- **Compact Channel Legend**: Scrollable legend with frequency ranges and color coding
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile planning
- **Streamlined Layout**: Removed redundant elements for cleaner interface

---

## 🔧 Technical Highlights

### Spectrum Management
- **2.4 GHz**: 3 non-overlapping channels (1, 6, 11) with strict adjacency prevention
- **5 GHz**: 28+ channels across UNII-1 (36-48), UNII-2A (52-64), UNII-2C (100-144), UNII-3 (149-165)
- **6 GHz**: 59 channels across UNII-5 (1-93, LPI), UNII-6 (97-117, VLP), UNII-7 (121-185, AFC), UNII-8 (189-233)

### Channel Assignment Intelligence
- **Interference Scoring**: Advanced algorithms calculate optimal channel placement
- **Multi-Dimensional Analysis**: Considers horizontal, vertical, and floor-to-floor interference
- **Band-Specific Logic**: Different optimization strategies for 2.4 GHz vs 5/6 GHz
- **Fallback Mechanisms**: Smart handling when optimal assignments aren't possible

### Professional Features
- **Export Functionality**: Generate channel plans for deployment documentation
- **Comprehensive Statistics**: Total APs, channels used, frequency distribution
- **Building Flexibility**: Support for various layouts and room configurations
- **Visual Feedback**: Hover effects and detailed AP information

---

## 🚀 How to Use

### Access the WiFi Channel Planner
1. Navigate to Guardian Relay main page
2. Click **📡 WiFi Channel Planner** in the feature navigation bar
3. Configure your building layout (rooms, floors)
4. Select frequency bands and channel width
5. Choose AP deployment density
6. Generate and visualize your channel plan

### Key Configuration Options
- **Building Layout**: Define rooms along/across hallway and number of floors
- **Channel Width**: Select 20, 40, 80, or 160 MHz
- **Frequency Bands**: Enable/disable 2.4 GHz, 5 GHz sub-bands, 6 GHz sub-bands
- **AP Density**: Choose coverage density based on deployment requirements

---

## 🎨 Visual Improvements

### Color-Coded Channels
- **Red**: 2.4 GHz channels
- **Blue**: 5 GHz UNII-1 (36-48)
- **Green**: 5 GHz UNII-2A (52-64)
- **Purple**: 5 GHz UNII-2C (100-144)
- **Orange**: 5 GHz UNII-3 (149-165)
- **Cyan**: 6 GHz channels

### Interactive Elements
- **Room Tiles**: Show channel assignments with multi-band split colors
- **Channel Legend**: Scrollable list with frequency ranges
- **Building Diagram**: Visual representation of floor plans
- **Statistics Panel**: Real-time metrics and deployment information

---

## 🛠️ Architecture

### Modular Design
- **Standalone Tool**: Independent `/wifi-planner/` directory structure
- **Express.js Integration**: Seamless routing and static file serving
- **No Dependencies**: Vanilla JavaScript for maximum compatibility
- **Responsive CSS**: Modern layout techniques for all devices

### Performance Optimizations
- **Efficient Algorithms**: Fast channel assignment even for large buildings
- **Dynamic Updates**: Real-time visualization without page reloads
- **Scalable Graphics**: Clean visualization regardless of building size
- **Event-Driven**: Reactive UI updates based on user configuration

---

## 📋 Use Cases

### Professional Deployment Planning
- **Multi-Tenant Buildings**: Apartment complexes, office buildings
- **Educational Facilities**: Schools, universities with multiple floors
- **Healthcare**: Hospitals with complex room layouts
- **Hospitality**: Hotels requiring dense AP coverage

### Network Design Validation
- **Pre-Deployment Planning**: Validate channel assignments before installation
- **Interference Analysis**: Identify potential conflict areas
- **Capacity Planning**: Determine optimal AP density for coverage requirements
- **Documentation**: Generate professional deployment documentation

---

## 🔄 Upgrade Notes

### New Installation
Guardian Relay v1.2.0 is a standard update that maintains full backward compatibility with existing device management features.

### Existing Users
- All existing functionality remains unchanged
- New WiFi Channel Planner is accessible via the feature navigation bar
- No configuration changes required for device management features

---

## 🎯 Next Steps

With v1.2.0, Guardian Relay establishes itself as a comprehensive network management platform combining real-time device management with professional planning tools. The WiFi Channel Planner represents the first of many planned standalone network design tools.

### Getting Started
1. Update to Guardian Relay v1.2.0
2. Explore the new WiFi Channel Planner
3. Plan your next WiFi deployment with professional precision
4. Export channel plans for field deployment teams

---

## 🐛 Known Issues
- None reported at release time

## 🆘 Support
For issues and support: [GitHub Issues](https://github.com/ISP-Academy/mikrotik-controller/issues)

---

**Guardian Relay v1.2.0** - Professional network management with advanced WiFi planning capabilities.