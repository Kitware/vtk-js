#!/bin/bash

# Source: https://github.com/thewtex/docker-opengl/tree/webgl

container=webgl
image=thewtex/opengl:ubuntu2004
port=6080
extra_run_args=""
quiet=""
debug=""

show_help() {
cat << EOF
Usage: ${0##*/} [-h] [-q] [-c CONTAINER] [-i IMAGE] [-p PORT] [-r DOCKER_RUN_FLAGS]

This script is a convenience script to run Docker images based on
thewtex/opengl. It:

- Makes sure docker is available
- On Windows and Mac OSX, creates a docker machine if required
- Informs the user of the URL to access the container with a web browser
- Stops and removes containers from previous runs to avoid conflicts
- Mounts the present working directory to /home/user/work on Linux and Mac OSX
- Prints out the graphical app output log following execution
- Exits with the same return code as the graphical app

Options:

  -h             Display this help and exit.
  -c             Container name to use (default ${container}).
  -i             Image name (default ${image}).
  -p             Port to expose HTTP server (default ${port}). If an empty
                 string, the port is not exposed.
  -r             Extra arguments to pass to 'docker run'. E.g. --env="APP=test/my-test-command.sh"
  -d             Debug by exposing the graphical environment with noVNC.
  -q             Do not output informational messages.
EOF
}

while [ $# -gt 0 ]; do
	case "$1" in
		-h)
			show_help
			exit 0
			;;
		-c)
			container=$2
			shift
			;;
		-i)
			image=$2
			shift
			;;
		-p)
			port=$2
			shift
			;;
		-r)
			extra_run_args="$extra_run_args $2"
			shift
			;;
		-d)
			debug=0
			shift
			;;
		-q)
			quiet=1
			;;
		*)
			show_help >&2
			exit 1
			;;
	esac
	shift
done


which docker 2>&1 >/dev/null
if [ $? -ne 0 ]; then
	echo "Error: the 'docker' command was not found.  Please install docker."
	exit 1
fi

os=$(uname)
if [ "${os}" != "Linux" ]; then
	vm=$(docker-machine active 2> /dev/null || echo "default")
	if ! docker-machine inspect "${vm}" &> /dev/null; then
		if [ -z "$quiet" ]; then
			echo "Creating machine ${vm}..."
		fi
		docker-machine -D create -d virtualbox --virtualbox-memory 2048 ${vm}
	fi
	docker-machine start ${vm} > /dev/null
    eval $(docker-machine env $vm --shell=sh)
fi

ip=$(docker-machine ip ${vm} 2> /dev/null || echo "localhost")
url="http://${ip}:$port"

cleanup() {
	docker stop $container >/dev/null
	docker rm $container >/dev/null
}

running=$(docker ps -a -q --filter "name=${container}")
if [ -n "$running" ]; then
	if [ -z "$quiet" ]; then
		echo "Stopping and removing the previous session..."
		echo ""
	fi
	cleanup
fi

if [ -z "$quiet" ]; then
	echo ""
	echo "Setting up the graphical application container..."
	echo ""
	if [ -n "$port" ]; then
		echo "Point your web browser to ${url}"
		echo ""
	fi
fi

pwd_dir="$(pwd)"
mount_local=""
if [ "${os}" = "Linux" ] || [ "${os}" = "Darwin" ]; then
	mount_local=" -v ${pwd_dir}:/home/user/work "
fi
port_arg=""
if [ -n "$port" ]; then
	port_arg="-p $port:6080"
fi
debug_arg=""
if [ -n "$debug" ]; then
   debug_arg=--env=APP=""
fi

docker run \
  -d \
  --name $container \
  --privileged \
  --workdir /home/user/work \
  ${mount_local} \
  $port_arg \
  --env="APP=npm run test:firefox" \
  $extra_run_args \
  $debug_arg \
  $image >/dev/null

print_app_output() {
	docker cp $container:/var/log/supervisor/graphical-app-launcher.log - \
		| tar xO
	result=$(docker cp $container:/tmp/graphical-app.return_code - \
		| tar xO)
	cleanup
	exit $result
}

trap "docker stop $container >/dev/null && print_app_output" SIGINT SIGTERM

docker wait $container >/dev/null

print_app_output

# vim: noexpandtab shiftwidth=4 tabstop=4 softtabstop=0
