# Development Setup

## Installing Go

**Linux**

Download the latest release from https://go.dev/dl/ and extract it:

```bash
tar -C /usr/local -xzf go1.24.linux-amd64.tar.gz
```

Add Go to your PATH by adding this to `~/.bashrc` or `~/.zshrc`:

```bash
export PATH=$PATH:/usr/local/go/bin
```

Reload your shell:

```bash
source ~/.bashrc
```

**macOS**

```bash
brew install go
```

**Windows**

Download and run the installer from https://go.dev/dl/

---

Verify the installation:

```bash
go version
```

## Installing Docker

Docker is required to run the MQTT broker.

**Linux**

Follow the official guide for your distro: https://docs.docker.com/engine/install/

After installing, add your user to the docker group so you don't need `sudo`:

```bash
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

**macOS / Windows**

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop/

---

Verify the installation:

```bash
docker --version
docker compose version
```

## Installing the Mosquitto clients (optional)

The Mosquitto CLI tools (`mosquitto_pub` / `mosquitto_sub`) are useful for manually publishing commands and monitoring topics during development. They are not required to run the simulator.

**Linux (Debian/Ubuntu)**

```bash
sudo apt install mosquitto-clients
```

**macOS**

```bash
brew install mosquitto
```

**Windows**

Download the installer from https://mosquitto.org/download/ — the clients are included.

## Getting started

Once the above are installed, clone the repository and follow the steps in [README.md](README.md).
