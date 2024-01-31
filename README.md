# Zircon3D Home Assistant Proxy

Provides a secure way to access your smart home data and devices within your home network.

## Why It Is Needed

Zircon3D and Home Assistant communicate **within your home network** to ensure safety, preventing new data exposures in your smart home system. Therefore, while you can edit and view your Zircon3D projects from anywhere with an internet connection, you cannot see data or control devices outside your home network.

Furthermore, when accessing from home, Zircon3D cannot reach your data and devices due to **browser security protocols** that prevent web applications opened with `https` from accessing `http` services, which is common in most Home Assistant installations. 

## How It Works

This addon:
- Proxies access to the Home Assistant system via an internal channel.
- Proxies access to Zircon3D cloud services via `https`.
- Allows access to the Zircon3D UI from the Home Assistant's sidebar.
- Enables Zircon3D UI access on Home Assistant's dashboards using a `web page card`.
- Permits access to the Zircon3D UI from any web browser via `http://homeassistant.local:11200`.

## How to Install

### Create New Zircon3D Account, Prepare Zircon Access Token, Group ID and Project ID

1. **Create a Zircon3D Account**:
   - If you don't have a Zircon3D account, sign up for free at `https://zircon3d.com`. A smart home visualization project will be automatically created.

2. **Create a Zircon Access Token**
   -  You can generate a `Zircon Access Token` at `https://zircon3d.com/user/profile`

3. **Record Project Information**:
   - In your Zircon3D project console, note your `group id` and `project id`.

### Install and Start Zircon3D HA Proxy

1. **Add Zircon HA Repository**:
   - In the Home Assistant UI, navigate to `Settings -> Add-on Store`.
   - Click the vertical dots button at the top-right corner, then click `Manage Repositories`.
   - Add a new repository with the provided URL.

2. **Install Zircon HA Proxy Add-on**:
   - Return to the Add-on Store page, where you should find `Zircon HA Proxy`.
   - Click `Install`. Installation may take a few minutes.

3. **Configure and Start Zircon HA Proxy Add-on**:
   - In the Zircon HA Proxy add-on's settings page, click the `Configure` tab.
   - Fill in your `Zircon Access Token`, `Group ID` and `Project ID`.
   - Go to the `Info` tab and enable `Show in Sidebar`.
   - Click `Start`.

4. **Access Zircon3D**:
   - Click the `Zircon3D` icon in the sidebar to access the Zircon3D web UI. You should now be able to view your devices from the `Monitoring` side panel.
