import logging
import os
import docker
import requests
import subprocess
from flask import request, redirect, url_for
from flask_restful import Resource

logger = logging.getLogger('electric.status.{0}'.format(__name__))

def read_output_for(args):
    proc = subprocess.Popen(args, stdout=subprocess.PIPE)
    out, err = proc.communicate()
    return out, err, proc.returncode


class WiFiConnectionResource(Resource):
    def read_wpa_ssid(self):
        """Read contents of the wpa supplicant file to see what we are connected to"""
        return read_output_for(["/home/pi/sudo_get_ssid.sh"])

    def read_wifi_ipaddr(self):
        return read_output_for(["/home/pi/get_wifi_ip_address.sh"])

    def get(self):
        ssid_out, ssid_err, ssid_rtn = self.read_wpa_ssid()
        ip_out, ip_err, ip_rtn = self.read_wifi_ipaddr()

        return {
            "SSID": ssid_out.strip("\n"),
            "IPADDR": ip_out.strip("\n"),
            "PSK": "********"
        }

    def put(self):
        print "I would set:", request.json
        return redirect(url_for("wifi"))


class StatusResource(Resource):
    def __init__(self):
        self.docker_cli = docker.from_env()

    def _systemctl_running(self, name):
        return os.system("systemctl is-active %s > /dev/null" % (name,)) == 0

    def _systemctl_start(self, name):
        out, err, rtn = read_output_for(["/home/pi/sudo_systemctl_start.sh", name])
        return rtn == 0

    def _systemctl_stop(self, name):
        out, err, rtn = read_output_for(["/home/pi/sudo_systemctl_stop.sh", name])
        return rtn == 0

    def check_docker_image_exists(self):
        """Check if the scornflake/electric-pi image has been downloaded already and what version is it?"""
        try:
            image = self.docker_cli.images.get("scornflake/electric-pi")
            return True
        except docker.errors.ImageNotFound:
            pass
        return False

    def check_docker_container_created(self):
        """Check if the container for the iCharger service has been created"""
        try:
            cont = self.docker_cli.containers.get("electric-pi")
            return True
        except docker.errors.NotFound:
            pass
        return False

    def check_docker_image_running(self):
        """Checks to see if the created container is actually running"""
        try:
            cont = self.docker_cli.containers.get("electric-pi")
            return cont.status == "running"
        except docker.errors.NotFound:
            pass
        return False

    def get_server_status(self):
        """Calls into the running container to obtain the status of the iCharger service"""
        return requests.get('http://127.0.0.1:5000/status').json()

    def post(self):
        try:
            json_dict = request.json
            run_electric_pi = json_dict["electric-pi.service"]["running"]
            if run_electric_pi:
                self._systemctl_start("electric-pi")
            else:
                self._systemctl_stop("electric-pi")

        except Exception:
            pass

        return redirect(url_for("status"))

    def get(self):
        logger.debug("yeah")
        # simply check for the correct configuration of required system resources and return this
        # in a dict
        res = dict()

        res["dnsmasq"] = {
            "running": self._systemctl_running("dnsmasq")
        }

        res["hostapd"] = {
            "running": self._systemctl_running("hostapd")
        }

        res["electric-pi.service"] = {
            "running": self._systemctl_running("electric-pi")
        }

        res["electric-pi-status.service"] = {
            "running": self._systemctl_running("electric-pi-status")
        }

        image_running = self.check_docker_image_running()
        res["docker"] = {
            "running": self._systemctl_running("docker"),
            "image_exists": self.check_docker_image_exists(),
            "container_created": self.check_docker_container_created(),
            "container_running": image_running
        }

        server_status = {
            "exception": "the electric-pi container is not running (in docker)"
        }

        if image_running:
            server_status = self.get_server_status()

        res["server_status"] = server_status

        return res