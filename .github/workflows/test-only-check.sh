#!/bin/bash
cd $(dirname $(readlink -e $0))/../../
! git grep 'test\.only(' **/test*.js
