#!/bin/sh
# Sets up the wasteio-backend MQTT client in mosquitto dynsec.
# Run this once after bootstrapping dynsec.json with mosquitto_ctrl dynsec init.
#
# Usage:
#   DYNSEC_ADMIN_PASS=<pass> BACKEND_PASS=<pass> ./setup-dynsec.sh
# or:
#   ./setup-dynsec.sh <admin-pass> <backend-pass>

ADMIN_PASS="${1:-$DYNSEC_ADMIN_PASS}"
BACKEND_PASS="${2:-$BACKEND_PASS}"

if [ -z "$ADMIN_PASS" ] || [ -z "$BACKEND_PASS" ]; then
    echo "Usage: DYNSEC_ADMIN_PASS=<pass> BACKEND_PASS=<pass> $0"
    echo "   or: $0 <admin-pass> <backend-pass>"
    exit 1
fi

CTRL="mosquitto_ctrl -h localhost -p 1883 -u dynsec-admin -P $ADMIN_PASS"

echo "Creating wasteio-backend client..."
$CTRL dynsec createClient wasteio-backend -p "$BACKEND_PASS"

echo "Creating wasteio-backend-role..."
$CTRL dynsec createRole wasteio-backend-role

echo "Adding ACLs..."
$CTRL dynsec addRoleACL wasteio-backend-role publishClientSend '$CONTROL/dynamic-security/v1' allow
$CTRL dynsec addRoleACL wasteio-backend-role subscribePattern 'waste/devices/+/telemetry' allow
$CTRL dynsec addRoleACL wasteio-backend-role subscribePattern 'waste/devices/+/events' allow
$CTRL dynsec addRoleACL wasteio-backend-role publishClientSend 'waste/devices/+/commands' allow
$CTRL dynsec addRoleACL wasteio-backend-role publishClientSend 'waste/devices/+/config' allow

echo "Assigning role to wasteio-backend..."
$CTRL dynsec addClientRole wasteio-backend wasteio-backend-role

echo "Done. Test with:"
echo "  mosquitto_pub -h localhost -p 1883 -u wasteio-backend -P <backend-pass> -t waste/devices/test/commands -m ping"
