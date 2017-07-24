#!/usr/bin/env bash
BASHSOURCE=$0
DIR="$( cd "$( dirname "$BASHSOURCE" )" && pwd )"
export PYTHONPATH=$DIR
watchmedo auto-restart -p "*.py;" --recursive gunicorn --bind=0.0.0.0:5000 --reload --workers=10 --backlog=300 "electric.wsgi:application"
