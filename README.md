# MikroTik Router Controller

A web-based interface for managing MikroTik routers with features for:
- Router management and monitoring
- Queue management (bandwidth control)
- Software updates and firmware upgrades
- Real-time traffic monitoring
- Scheduled operations

## Quick Install

### Prerequisites
- Docker and Docker Compose installed
- Access to your local network

### Installation

1. **Download the installer:**
   ```bash
   curl -o install.sh https://raw.githubusercontent.com/yourusername/mikrotik-controller/main/install.sh
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
curl -o update.sh https://raw.githubusercontent.com/yourusername/mikrotik-controller/main/update.sh
chmod +x update.sh
./update.sh
```

### Uninstall

```bash
curl -o uninstall.sh https://raw.githubusercontent.com/yourusername/mikrotik-controller/main/uninstall.sh
chmod +x uninstall.sh
./uninstall.sh
```

## Manual Installation

If you prefer manual installation:

```bash
# Download docker-compose.yml
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/mikrotik-controller/main/docker-compose.yml

# Start the service
docker-compose up -d

# Access at http://localhost:3333
```

## Features

- **Router Management**: Connect to and monitor MikroTik routers
- **System Information**: View router status, uptime, CPU, memory usage
- **Queue Management**: Create and modify bandwidth queues for devices
- **Software Updates**: Check for and install RouterOS updates
- **Firmware Upgrades**: Upgrade RouterBOARD firmware
- **Traffic Monitoring**: Real-time traffic graphs for WAN interfaces
- **Scheduled Operations**: Schedule reboots and maintenance tasks

## Configuration

The application runs on port 3333 by default. To change this, edit the docker-compose.yml file:

```yaml
ports:
  - "YOUR_PORT:3333"
```

## Support

For issues and support, please visit: [GitHub Issues](https://github.com/yourusername/mikrotik-controller/issues)

## License

MIT License - See LICENSE file for details