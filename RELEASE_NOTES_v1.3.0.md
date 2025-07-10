# Guardian Relay v1.3.0 Release Notes

## Release Date: July 10, 2025

## New Features

### 🎯 Queue Management Enhancements

#### Pagination System
- **10 Items Per Page**: Both DHCP leases and queues now display 10 items per page for better readability
- **Dual Navigation**: Page selectors appear at both top and bottom of tables for easy navigation
- **Independent Pagination**: DHCP leases and queues have separate page tracking
- **Smart Page Display**: Shows "X-Y of Z items" and intelligent page number display with ellipsis

#### Show All Queues
- **New Button**: "Show All Queues" button added to queue management interface
- **Queue-Only View**: Displays all queues without DHCP lease information
- **Full Pagination Support**: Maintains the 10-per-page pagination for large queue lists

### 🚫 IP Blocking System

#### BLOCK/UNBLOCK Functionality
- **Quick Actions**: New BLOCK/UNBLOCK buttons in the DHCP leases table
- **Visual Indicators**: 
  - Red BLOCK button for unblocked IPs
  - Green UNBLOCK button for blocked IPs
- **Firewall Integration**: Manages the BLOCKED-CUSTOMERS address list in MikroTik firewall
- **Router Time Sync**: Uses router's local time in block comments instead of server UTC time
- **Instant Updates**: UI refreshes immediately after blocking/unblocking actions

## Technical Improvements

### Backend
- Implemented SSH-based commands for reliable IP blocking operations
- Added API endpoints for managing blocked customers list
- Improved error handling for firewall operations

### Frontend
- Enhanced table layouts to accommodate action buttons
- Added CSS styling for block/unblock button states
- Implemented state management for blocked IPs

## Bug Fixes
- Fixed API connectivity issues with queue operations
- Resolved timezone discrepancies in comments
- Corrected pagination state management

## Upgrade Instructions

### Docker
```bash
docker pull guardian-relay:1.3.0
docker stop guardian-relay
docker run -d --name guardian-relay -p 3333:3333 guardian-relay:1.3.0
```

### Manual Installation
```bash
git pull origin main
npm install
npm start
```

## Compatibility
- MikroTik RouterOS 6.x and 7.x
- Requires SSH and API access enabled on router
- BLOCKED-CUSTOMERS address list will be created automatically if not present

## Known Issues
- None at this time

## Contributors
- Guardian Relay Development Team

---

**Full Changelog**: [v1.2.0...v1.3.0](https://github.com/yourusername/guardian-relay/compare/v1.2.0...v1.3.0)