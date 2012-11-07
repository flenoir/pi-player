#!/bin/bash
omxplayer "$1" < /tmp/omx && echo -n . > /tmp/omx
